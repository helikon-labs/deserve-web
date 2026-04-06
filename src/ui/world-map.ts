import { select, geoMercator, geoPath, type Selection } from 'd3';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry, GeoJsonProperties, Polygon, Feature } from 'geojson';
import { getDOMElementById } from './dom';
import { RPC_NODES, type RPCNode } from '@/data/node';
import { nodeStateAtoms, type NodeState } from '@/data/network-store';

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

class WorldMap {
    private readonly mapContainer: HTMLDivElement;
    private svg: Selection<SVGSVGElement, unknown, null, undefined> | null = null;
    private countries: FeatureCollection<Geometry | null, GeoJsonProperties> | null = null;
    private tooltip: Selection<HTMLDivElement, unknown, null, undefined> | null = null;
    private activeUnsub: (() => void) | null = null;
    private readonly pingUnsubs: Array<() => void> = [];
    private hideTimeout: ReturnType<typeof setTimeout> | null = null;

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
        this.render();
        this.setupPingSubscriptions();
    }

    resize() {
        this.render();
    }

    private render() {
        if (!this.countries) {
            return;
        }
        const { clientWidth: width, clientHeight: height } = this.mapContainer;
        const projection = geoMercator().fitSize([width, height], WORLD_BOUNDS);
        const path = geoPath().projection(projection);
        if (!this.svg) {
            this.svg = select(this.mapContainer)
                .append('svg')
                .attr('width', '100%')
                .attr('height', '100%');
            this.svg.append('rect').attr('class', 'ocean');
            this.svg.append('g').attr('class', 'countries');
            this.svg.append('g').attr('class', 'nodes');
        }
        this.svg.attr('viewBox', `0 0 ${width} ${height}`);
        // ocean
        this.svg.select('rect.ocean').attr('width', width).attr('height', height);
        // countries
        this.svg
            .select<SVGGElement>('g.countries')
            .selectAll('path')
            .data(this.countries.features)
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
                g.append('circle').attr('r', 5).attr('class', 'node-ping');
                g.append('circle').attr('r', 5).attr('class', 'node-marker');
                return g;
            })
            .attr('transform', (d) => {
                const coords = projection([d.longitude, d.latitude]);
                return coords ? `translate(${coords[0]},${coords[1]})` : '';
            })
            .style('cursor', 'pointer')
            .on('mouseenter', (_, d) => {
                this.cancelHide();
                const coords = projection([d.longitude, d.latitude]);
                if (!coords || !this.tooltip) return;
                this.tooltip
                    .style('display', 'block')
                    .style('left', `${coords[0]}px`)
                    .style('top', `${coords[1]}px`);
                this.activeUnsub?.();
                const stateAtom = nodeStateAtoms.get(d.id);
                if (!stateAtom) return;
                // nanostores fires subscribe synchronously with the current value,
                // so content is set before the browser paints despite appearing after display:block
                this.activeUnsub = stateAtom.subscribe((state) => {
                    this.renderTooltipContent(d, state);
                });
            })
            .on('mouseleave', () => {
                this.scheduleHide();
            });
    }

    private renderTooltipContent(node: RPCNode, state: NodeState): void {
        if (!this.tooltip) return;
        const best = state.bestBlock?.toLocaleString() ?? '—';
        const finalized = state.finalizedBlock?.toLocaleString() ?? '—';
        const latency = state.latencyMs !== null ? `${state.latencyMs} ms` : '—';
        this.tooltip.html(`
            <div class="tooltip-city">${node.city}</div>
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
            btn.addEventListener('click', () => {
                void navigator.clipboard
                    .writeText(node.wsURL)
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
            let lastBestBlock: number | null = null;
            const unsub = stateAtom.subscribe((state) => {
                if (state.bestBlock !== null && state.bestBlock !== lastBestBlock) {
                    lastBestBlock = state.bestBlock;
                    this.triggerPing(node.id);
                }
            });
            this.pingUnsubs.push(unsub);
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
        for (const unsub of this.pingUnsubs) {
            unsub();
        }
        this.pingUnsubs.length = 0;
    }
}

export { WorldMap };
