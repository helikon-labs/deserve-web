import { select, geoMercator, geoPath, type Selection } from 'd3';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry, GeoJsonProperties, Polygon, Feature } from 'geojson';
import { getDOMElementById } from './dom';
import { RPC_NODES, type RpcNode } from '@/data/node';

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

    constructor() {
        this.mapContainer = getDOMElementById('map-container', HTMLDivElement);
    }

    async setup() {
        const response = await fetch('/countries-110m.json');
        const world = (await response.json()) as WorldTopology;
        this.countries = feature(world, world.objects.countries);
        this.render();
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
        this.svg.append('g').attr('class', 'nodes');
        this.svg
            .select<SVGGElement>('g.nodes')
            .selectAll<SVGGElement, RpcNode>('g.node')
            .data(RPC_NODES, (d) => d.city)
            .join((enter) => {
                const g = enter.append('g').attr('class', 'node');
                g.append('circle').attr('r', 5).attr('class', 'node-marker');
                g.append('text')
                    .attr('x', 8)
                    .attr('y', 4)
                    .attr('class', 'node-label')
                    .text((d) => d.city);
                return g;
            })
            .attr('transform', (d) => {
                const coords = projection([d.longitude, d.latitude]);
                return coords ? `translate(${coords[0]},${coords[1]})` : '';
            });
    }
}

export { WorldMap };
