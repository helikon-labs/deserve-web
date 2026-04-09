import {
    select,
    geoMercator,
    geoPath,
    zoom,
    zoomIdentity,
    type Selection,
    type ZoomBehavior,
    type ZoomTransform,
} from 'd3';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry, GeoJsonProperties, Polygon, Feature } from 'geojson';
import { getDOMElementById } from './dom';
import { RPC_NODES, getNodes, type RPCNode } from '@/data/node';
import { nodeStateAtoms, type NodeState } from '@/data/network-store';
import { selectedChain } from '@/data/chain-store';
import { ASSET_HUB_SVG, CORETIME_SVG } from './icon';
import type { Chain } from '@/data/node';

const CHAIN_ICONS: Record<Chain, string> = {
    'asset-hub': ASSET_HUB_SVG,
    coretime: CORETIME_SVG,
};

type WorldTopology = Topology<{
    countries: GeometryCollection;
    land: GeometryCollection;
}>;

const WORLD_BOUNDS: Feature<Polygon> = {
    type: 'Feature',
    geometry: {
        type: 'Polygon',
        coordinates: [
            [
                [-180, -62],
                [180, -62],
                [180, 78],
                [-180, 78],
                [-180, -62],
            ],
        ],
    },
    properties: null,
};

const NODE_RADIUS = 5;
const HIT_RADIUS = 16;

class WorldMap {
    private readonly mapContainer: HTMLDivElement;
    private svg: Selection<SVGSVGElement, unknown, null, undefined> | null = null;
    private countries: FeatureCollection<Geometry | null, GeoJsonProperties> | null = null;
    private tooltip: Selection<HTMLDivElement, unknown, null, undefined> | null = null;
    private projection: ReturnType<typeof geoMercator> | null = null;
    private zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | null = null;
    private currentTransform: ZoomTransform = zoomIdentity;
    private activeUnsub: (() => void) | null = null;
    private readonly pingUnsubs: Array<() => void> = [];
    private readonly lastBestBlocks: Map<number, number | null> = new Map();
    private hideTimeout: ReturnType<typeof setTimeout> | null = null;

    private readonly onContainerTouchStart = (): void => {
        this.scheduleHide();
    };

    constructor() {
        this.mapContainer = getDOMElementById('map-container', HTMLDivElement);
    }

    async setup() {
        const response = await fetch('/countries-110m.json');
        const world = (await response.json()) as WorldTopology;
        this.countries = feature(world, world.objects.countries);
        this.tooltip = select(this.mapContainer).append('div').attr('class', 'node-tooltip');
        this.tooltip.on('mouseenter', () => {
            this.cancelHide();
        });
        this.tooltip.on('mouseleave', () => {
            this.scheduleHide();
        });
        this.mapContainer.addEventListener('touchstart', this.onContainerTouchStart, {
            passive: true,
        });
        this.render();
        this.setupPingSubscriptions();
    }

    resize() {
        this.render();
        // Reset zoom when the projection is recalculated
        if (this.svg && this.zoomBehavior) {
            this.svg.call(this.zoomBehavior.transform, zoomIdentity);
        }
    }

    private render() {
        if (!this.countries) {
            return;
        }
        const { clientWidth: width, clientHeight: height } = this.mapContainer;
        this.projection = geoMercator().fitSize([width, height], WORLD_BOUNDS);
        if (height > width) {
            // portrait (mobile): shift map upward so nodes aren't hidden behind the info panel
            const [tx, ty] = this.projection.translate();
            this.projection.translate([tx, ty - height * 0.08]);
        }
        const path = geoPath().projection(this.projection);
        if (!this.svg) {
            this.svg = select(this.mapContainer)
                .append('svg')
                .attr('width', '100%')
                .attr('height', '100%');
            this.svg.append('rect').attr('class', 'ocean');
            const mapContent = this.svg.append('g').attr('class', 'map-content');
            mapContent.append('g').attr('class', 'countries');
            mapContent.append('g').attr('class', 'nodes');

            this.zoomBehavior = zoom<SVGSVGElement, unknown>()
                .scaleExtent([1, 8])
                .on('start', () => {
                    this.scheduleHide();
                })
                .on('zoom', (event: { transform: ZoomTransform }) => {
                    this.currentTransform = event.transform;
                    this.svg
                        ?.select<SVGGElement>('g.map-content')
                        .attr('transform', event.transform.toString());
                    const k = event.transform.k;
                    this.svg
                        ?.selectAll<SVGCircleElement, RPCNode>('circle.node-marker')
                        .attr('r', NODE_RADIUS / k);
                    this.svg
                        ?.selectAll<SVGCircleElement, RPCNode>('circle.node-hit-area')
                        .attr('r', HIT_RADIUS / k);
                    this.svg
                        ?.selectAll<SVGCircleElement, RPCNode>('circle.node-ping')
                        .attr('r', NODE_RADIUS / k);
                });
            this.svg.call(this.zoomBehavior);
        }
        this.svg.attr('viewBox', `0 0 ${width} ${height}`);
        // ocean
        this.svg.select('rect.ocean').attr('width', width).attr('height', height);
        // countries
        this.svg
            .select<SVGGElement>('g.countries')
            .selectAll('path')
            .data(this.countries.features.filter((f) => f.id !== '010'))
            .join('path')
            .attr('d', path)
            .attr('class', 'country');
        // nodes
        this.svg
            .select<SVGGElement>('g.nodes')
            .selectAll<SVGGElement, RPCNode>('g.node')
            .data(RPC_NODES, (d) => d.id)
            .join((enter) => {
                const g = enter
                    .append('g')
                    .attr('class', 'node')
                    .attr('data-id', (d) => d.id);
                g.append('circle').attr('r', HIT_RADIUS).attr('class', 'node-hit-area');
                g.append('circle').attr('r', NODE_RADIUS).attr('class', 'node-ping');
                g.append('circle').attr('r', NODE_RADIUS).attr('class', 'node-marker');
                return g;
            })
            .attr('transform', (d) => {
                const coords = this.projection!([d.longitude, d.latitude]);
                return coords ? `translate(${coords[0]},${coords[1]})` : '';
            })
            .style('cursor', 'pointer')
            .on('mouseenter', (_, d) => {
                this.showTooltipForNode(d);
            })
            .on('mouseleave', () => {
                this.scheduleHide();
            })
            .on(
                'touchstart',
                (event, d) => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.showTooltipForNode(d);
                },
                { passive: false } as AddEventListenerOptions,
            );
    }

    private showTooltipForNode(d: RPCNode): void {
        this.cancelHide();
        if (!this.projection || !this.tooltip) return;
        const baseCoords = this.projection([d.longitude, d.latitude]);
        if (!baseCoords) return;
        // Apply current zoom transform to get actual screen position
        const [x, y] = this.currentTransform.apply(baseCoords);
        this.tooltip.style('display', 'block').style('top', `${y}px`);
        const padding = 8;
        const tooltipWidth = this.tooltip.node()!.offsetWidth;
        const containerWidth = this.mapContainer.getBoundingClientRect().width;
        const clampedLeft = Math.max(
            padding,
            Math.min(x - tooltipWidth / 2, containerWidth - tooltipWidth - padding),
        );
        this.tooltip.style('left', `${clampedLeft}px`);
        this.activeUnsub?.();
        const stateAtom = nodeStateAtoms.get(d.id);
        if (!stateAtom) return;
        // nanostores fires subscribe synchronously with the current value,
        // so content is set before the browser paints despite appearing after display:block
        this.activeUnsub = stateAtom.subscribe((state) => {
            this.renderTooltipContent(d, state);
        });
    }

    private renderTooltipContent(node: RPCNode, state: NodeState): void {
        if (!this.tooltip) return;
        const chainIcon = CHAIN_ICONS[selectedChain.get()];
        const best = state.bestBlock?.toLocaleString() ?? '—';
        const finalized = state.finalizedBlock?.toLocaleString() ?? '—';
        const latency = state.latencyMs !== null ? `${state.latencyMs} ms` : '—';
        this.tooltip.html(`
            <div class="tooltip-city"><span class="tooltip-chain-icon">${chainIcon}</span>${node.city}</div>
            <div class="tooltip-row">
                <span class="tooltip-label">Best</span>
                <span class="tooltip-value">${best}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Finalized</span>
                <span class="tooltip-value">${finalized}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Latency</span>
                <span class="tooltip-value">${latency}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Endpoint</span>
                <button class="tooltip-copy-btn">copy url</button>
            </div>
        `);
        const btn = this.tooltip.select<HTMLButtonElement>('.tooltip-copy-btn').node();
        if (btn) {
            const wsURL =
                getNodes(selectedChain.get()).find((n) => n.id === node.id)?.wsURL ?? node.wsURL;
            btn.addEventListener('click', () => {
                void navigator.clipboard
                    .writeText(wsURL)
                    .then(() => {
                        btn.textContent = 'copied!';
                        setTimeout(() => {
                            btn.textContent = 'copy url';
                        }, 2000);
                    })
                    .catch(() => {
                        /* clipboard unavailable, no-op */
                    });
            });
        }
    }

    private scheduleHide(): void {
        this.hideTimeout = setTimeout(() => {
            this.activeUnsub?.();
            this.activeUnsub = null;
            this.tooltip?.style('display', 'none');
        }, 120);
    }

    private cancelHide(): void {
        if (this.hideTimeout !== null) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }

    private setupPingSubscriptions(): void {
        for (const node of RPC_NODES) {
            const stateAtom = nodeStateAtoms.get(node.id);
            if (!stateAtom) continue;
            this.lastBestBlocks.set(node.id, null);
            const unsub = stateAtom.subscribe((state) => {
                const last = this.lastBestBlocks.get(node.id) ?? null;
                if (state.bestBlock !== null && state.bestBlock !== last) {
                    this.lastBestBlocks.set(node.id, state.bestBlock);
                    this.triggerPing(node.id);
                }
            });
            this.pingUnsubs.push(unsub);
        }
        let chainInitial = true;
        this.pingUnsubs.push(
            selectedChain.subscribe(() => {
                if (chainInitial) {
                    chainInitial = false;
                    return;
                }
                this.clearPingAnimations();
            }),
        );
    }

    private clearPingAnimations(): void {
        if (!this.svg) return;
        this.svg.selectAll<SVGCircleElement, RPCNode>('circle.node-ping').classed('active', false);
        for (const key of this.lastBestBlocks.keys()) {
            this.lastBestBlocks.set(key, null);
        }
    }

    private triggerPing(nodeId: number): void {
        if (!this.svg) return;
        const el = this.svg
            .select<SVGCircleElement>(`[data-id="${nodeId}"] circle.node-ping`)
            .node();
        if (!el) return;
        el.classList.remove('active');
        void el.getBoundingClientRect(); // force reflow to restart animation
        el.classList.add('active');
    }

    destroy(): void {
        this.cancelHide();
        this.activeUnsub?.();
        this.activeUnsub = null;
        this.mapContainer.removeEventListener('touchstart', this.onContainerTouchStart);
        for (const unsub of this.pingUnsubs) {
            unsub();
        }
        this.pingUnsubs.length = 0;
    }
}

export { WorldMap };
