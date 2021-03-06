/**
 * Typescript definition tests for d3/d3-zoom module
 *
 * Note: These tests are intended to test the definitions only
 * in the sense of typing and call signature consistency. They
 * are not intended as functional tests.
 */

import * as d3Zoom from 'd3-zoom';
import { ArrayLike, select, Selection, event } from 'd3-selection';
import { Transition } from 'd3-transition';
import { ScaleLinear } from 'd3-scale';

// --------------------------------------------------------------------------
// Preparatory Steps
// --------------------------------------------------------------------------

let points: Array<[number, number]> = [
    [10, 10], [20, 20], [50, 50]
];

// Canvas Prep -------------------------------------------------------------

interface CanvasDatum {
    width: number;
    height: number;
    radius: number;
}

let canvas = select<HTMLCanvasElement, any>('canvas')
    .datum<CanvasDatum>({ width: 500, height: 400, radius: 2.5 })
    .attr('width', function (d) { return d.width; })
    .attr('height', function (d) { return d.height; });

let context = canvas.node().getContext('2d');

function drawPointsOnCanvas(radius: number) {
    context.beginPath();
    points.forEach(drawPointOnCanvas(radius));
    context.fill();
}

function drawPointOnCanvas(radius: number) {

    return function (point: [number, number]) {
        context.moveTo(point[0] + radius, point[1]);
        context.arc(point[0], point[1], radius, 0, 2 * Math.PI);
    };
}


// SVG Prep -------------------------------------------------------------------

interface SVGDatum {
    width: number;
    height: number;
    filterBrushEvent: boolean;
}

let svg = select<SVGSVGElement, undefined>('svg')
    .datum<SVGDatum>({ width: 500, height: 500, filterBrushEvent: true })
    .attr('width', function (d) { return d.width; })
    .attr('height', function (d) { return d.height; });


let g = svg.append<SVGGElement>('g');

g.selectAll()
    .data<[number, number]>(points)
    .enter().append<SVGCircleElement>('circle')
    .attr('cx', function (d) { return d[0]; })
    .attr('cy', function (d) { return d[1]; })
    .attr('r', 2.5);

// For test of using zoomBehavior to transform selections and transitions ----

interface GroupDatum {
    byX: number;
    byY: number;
    byK: number;
    toK: number;
}

let groupsSelection: Selection<SVGGElement, GroupDatum, any, any>,
    groupsTransition: Transition<SVGGElement, GroupDatum, any, any>;


// --------------------------------------------------------------------------
// Test Define ZoomBehaviour
// --------------------------------------------------------------------------

// Canvas Example -----------------------------------------------------------

function zoomedCanvas(this: HTMLCanvasElement, d: CanvasDatum) {

    // Cast d3 event to D3ZoomEvent to be used in zoom event handler
    let e = <d3Zoom.D3ZoomEvent<HTMLCanvasElement, any>>event;

    context.save();
    context.clearRect(0, 0, this.width, this.height); // this element
    context.translate(e.transform.x, e.transform.y);
    context.scale(e.transform.k, e.transform.k);
    drawPointsOnCanvas(d.radius);
    context.restore();
}

let canvasZoom: d3Zoom.ZoomBehavior<HTMLCanvasElement, CanvasDatum>;

canvasZoom = d3Zoom.zoom()
    .scaleExtent([1 / 2, 4])
    .on('zoom', zoomedCanvas);

// SVG Example --------------------------------------------------------------

function zoomedSVGOverlay(this: SVGRectElement) {

    // Cast d3 event to D3ZoomEvent to be used in zoom event handler
    let e = <d3Zoom.D3ZoomEvent<HTMLCanvasElement, any>>event;

    g.attr('transform', e.transform.toString());
}

let svgZoom: d3Zoom.ZoomBehavior<SVGRectElement, SVGDatum>;

svgZoom = d3Zoom.zoom<SVGRectElement, SVGDatum>();


// filter() ----------------------------------------------------------------

// chainable
svgZoom = svgZoom.filter(function (d, i, group) {

    // Cast d3 event to D3ZoomEvent to be used in filter logic
    let e = <d3Zoom.D3ZoomEvent<SVGRectElement, SVGDatum>>event;

    console.log('Overlay Rectangle width: ', this.width.baseVal.value); // this typing is SVGRectElement
    return e.sourceEvent.type !== 'brush' || !d.filterBrushEvent; // datum type is SVGDatum (as propagated to SVGRectElement with zoom event attached)
});

let filterFn: (this: SVGRectElement, d?: SVGDatum, index?: number, group?: Array<SVGRectElement>) => boolean;
filterFn = svgZoom.filter();


// extent()  ---------------------------------------------------------------

let extentAccessor: (this: SVGRectElement, d: SVGDatum, index: number, group: Array<SVGRectElement>) => [[number, number], [number, number]];
extentAccessor = svgZoom.extent();

// chainable with array
svgZoom = svgZoom.extent([[0, 0], [200, 200]]);

// chainable with accessor function
svgZoom = svgZoom.extent(function (d, i, group) {
    console.log('Overlay Rectangle width: ', this.width.baseVal.value); // this typing is SVGRectElement
    return [[0, 0], [d.width, d.height]]; // datum type is SVGDatum
});

// scaleExtent()  ----------------------------------------------------------

// chainable
svgZoom = svgZoom.scaleExtent([0.5, 4]);

let scaleExtent: [number, number];
scaleExtent = svgZoom.scaleExtent();

// translationExtent()  ----------------------------------------------------

// chainable
svgZoom = svgZoom.translateExtent([[-500, -500], [500, 500]]);

let translateExtent: [[number, number], [number, number]];
translateExtent = svgZoom.translateExtent();


// duration() --------------------------------------------------------------

// chainable
svgZoom = svgZoom.duration(500);

let duration: number = svgZoom.duration();

// on() --------------------------------------------------------------------

// chainable
svgZoom = svgZoom.on('zoom', zoomedSVGOverlay);
// svgZoom = svgZoom.on('zoom', zoomedCanvas); // fails, zoom event handler has wrong this and datum type

let zoomHandler: (this: SVGRectElement, datum: SVGDatum, index: number, group: Array<SVGRectElement> | ArrayLike<SVGRectElement>) => void;
zoomHandler = svgZoom.on('zoom');

// chainable remove handler
svgZoom = svgZoom.on('zoom', null);

// re-apply
svgZoom.on('zoom', zoomHandler);

// --------------------------------------------------------------------------
// Test Attach ZoomBehaviour
// --------------------------------------------------------------------------


// Canvas Example -----------------------------------------------------------

// attach the zoom behavior to the canvas element
canvas.call(canvasZoom);

// SVG Example --------------------------------------------------------------

// attach the zoom behavior to an overlay svg rectangle
let svgOverlay: Selection<SVGRectElement, SVGDatum, HTMLElement, any> = svg.append<SVGRectElement>('rect')
    .attr('width', function (d) { return d.width; })
    .attr('height', function (d) { return d.height; })
    .style('fill', 'none')
    .style('pointer-events', 'all')
    .call(svgZoom);

let svgOverlayTransition = svgOverlay.transition();

// --------------------------------------------------------------------------
// Test Use ZoomBehaviour
// --------------------------------------------------------------------------

// transform() -------------------------------------------------------------------------------------

// use on selection
svgZoom.transform(svgOverlay, d3Zoom.zoomIdentity);
// svgZoom.transform(groupsSelection, d3Zoom.zoomIdentity); // fails, as groupSelection mismachtes DOM Element type and datum type

svgZoom.transform(svgOverlay, function (datum, index, groups) {
    let that: SVGRectElement = this;
    let d: SVGDatum = datum;
    let i: number = index;
    let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
    console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
    console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
    return d3Zoom.zoomIdentity;
});
// use on transition
svgOverlayTransition.call(svgZoom.transform, d3Zoom.zoomIdentity);
// svgZoom.transform(groupsTransition, d3Zoom.zoomIdentity); // fails, as groupTransition mismachtes DOM Element type and datum type

svgZoom.transform(svgOverlayTransition, d3Zoom.zoomIdentity);
svgZoom.transform(svgOverlayTransition, function (datum, index, groups) {
    let that: SVGRectElement = this;
    let d: SVGDatum = datum;
    let i: number = index;
    let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
    console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
    console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
    return d3Zoom.zoomIdentity;
});

// translateBy() -------------------------------------------------------------------------------------

// use on selection
svgZoom.translateBy(svgOverlay, 20, 50);
// svgZoom.translateBy(groupsSelection, 20, 50); // fails, as groupSelection mismachtes DOM Element type and datum type

svgZoom.translateBy(
    svgOverlay,
    20,
    function (datum, index, groups) {
        let that: SVGRectElement = this;
        let d: SVGDatum = datum;
        let i: number = index;
        let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
        console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
        console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
        return 30;
    });
svgZoom.translateBy(
    svgOverlay,
    function (datum, index, groups) {
        let that: SVGRectElement = this;
        let d: SVGDatum = datum;
        let i: number = index;
        let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
        console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
        console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
        return 30;
    },
    50);
svgZoom.translateBy(
    svgOverlay,
    function (datum, index, groups) {
        let that: SVGRectElement = this;
        let d: SVGDatum = datum;
        let i: number = index;
        let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
        console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
        console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
        return 30;
    },
    function (datum, index, groups) {
        let that: SVGRectElement = this;
        let d: SVGDatum = datum;
        let i: number = index;
        let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
        console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
        console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
        return 30;
    });

// use on transition
svgZoom.translateBy(svgOverlayTransition, 20, 50);
// svgZoom.translateBy(groupsTransition, 20, 50); // fails, as groupTransition mismachtes DOM Element type and datum type

svgZoom.translateBy(
    svgOverlayTransition,
    20,
    function (datum, index, groups) {
        let that: SVGRectElement = this;
        let d: SVGDatum = datum;
        let i: number = index;
        let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
        console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
        console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
        return 30;
    });
svgZoom.translateBy(
    svgOverlayTransition,
    function (datum, index, groups) {
        let that: SVGRectElement = this;
        let d: SVGDatum = datum;
        let i: number = index;
        let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
        console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
        console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
        return 30;
    },
    50);
svgZoom.translateBy(
    svgOverlayTransition,
    function (datum, index, groups) {
        let that: SVGRectElement = this;
        let d: SVGDatum = datum;
        let i: number = index;
        let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
        console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
        console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
        return 30;
    },
    function (datum, index, groups) {
        let that: SVGRectElement = this;
        let d: SVGDatum = datum;
        let i: number = index;
        let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
        console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
        console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
        return 30;
    });

// scaleBy() -------------------------------------------------------------------------------------

// use on selection
svgZoom.scaleBy(svgOverlay, 3);
// svgZoom.scaleBy(groupsSelection, 3); // fails, as groupSelection mismachtes DOM Element type and datum type

svgZoom.scaleBy(svgOverlay, function (datum, index, groups) {
        let that: SVGRectElement = this;
        let d: SVGDatum = datum;
        let i: number = index;
        let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
        console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
        console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
        return 3;
});
// use on transition
svgZoom.scaleBy(svgOverlayTransition, 3);
// svgZoom.scaleBy(groupsTransition, 3); // fails, as groupTransition mismachtes DOM Element type and datum type

svgZoom.scaleBy(svgOverlayTransition, function (datum, index, groups) {
        let that: SVGRectElement = this;
        let d: SVGDatum = datum;
        let i: number = index;
        let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
        console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
        console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
        return 3;
});

// scaleTo() -------------------------------------------------------------------------------------

// use on selection
svgZoom.scaleTo(svgOverlay, 3);
// svgZoom.scaleBy(groupsSelection, 3); // fails, as groupSelection mismachtes DOM Element type and datum type

svgZoom.scaleTo(svgOverlay, function (datum, index, groups) {
        let that: SVGRectElement = this;
        let d: SVGDatum = datum;
        let i: number = index;
        let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
        console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
        console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
        return 3;
});
// use on transition
svgZoom.scaleTo(svgOverlayTransition, 3);
// svgZoom.scaleBy(groupsTransition, 3); // fails, as groupTransition mismachtes DOM Element type and datum type

svgZoom.scaleTo(svgOverlayTransition, function (datum, index, groups) {
        let that: SVGRectElement = this;
        let d: SVGDatum = datum;
        let i: number = index;
        let g: Array<SVGRectElement> | ArrayLike<SVGRectElement> = groups;
        console.log('Owner SVG Element of svg rect: ', this.ownerSVGElement); // this is of type SVGRectElement
        console.log('Filter Brush Event status as per datum: ', d.filterBrushEvent); // datum type is SVGDatum
        return 30;
});

// --------------------------------------------------------------------------
// Test Zoom Event Interface
// --------------------------------------------------------------------------

let e: d3Zoom.D3ZoomEvent<SVGRectElement, SVGDatum>;

let target: d3Zoom.ZoomBehavior<SVGRectElement, SVGDatum> = e.target;
let type: 'start' | 'zoom' | 'end' | string = e.type;
let zoomTransform: d3Zoom.ZoomTransform = e.transform;
let sourceEvent: any = e.sourceEvent;

// --------------------------------------------------------------------------
// Test Zoom Transforms
// --------------------------------------------------------------------------

// Test zoomTransform(...) --------------------------------------------------

let zTransform: d3Zoom.ZoomTransform;

zTransform = d3Zoom.zoomTransform(canvas.node());

// Test ZoomTransform -------------------------------------------------------

let x: number = zTransform.x;
let y: number = zTransform.y;
let k: number = zTransform.k;

let transformedPoint: [number, number] = zTransform.apply([15, 20]);
let transformedX: number = zTransform.applyX(15);
let transformedY: number = zTransform.applyY(20);

let invertedPoint: [number, number] = zTransform.invert([150, 240]);
let invertedX: number = zTransform.invertX(150);
let invertedY: number = zTransform.invertY(240);

// TODO: reScaleX, reScaleY

let linearScale: ScaleLinear<number, number>;

linearScale = zTransform.rescaleX(linearScale);
linearScale = zTransform.rescaleY(linearScale);

let transformation: string = zTransform.toString();

zTransform = zTransform.translate(50, 40);

// zoomIdentity -------------------------------------------------------------

const z: d3Zoom.ZoomTransform = d3Zoom.zoomIdentity;
