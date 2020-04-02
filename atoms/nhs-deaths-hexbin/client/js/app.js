import loadJson from 'shared/js/load-json'
import covidMap from 'assets/covid-uk.json'
import * as d3B from 'd3'
import * as topojson from 'topojson'
import { $, $$, getDataUrlForEnvironment } from "shared/js/util"
import {event as currentEvent} from 'd3-selection';

const d3 = Object.assign({}, d3B, topojson);

const atomEl = d3.select('.interactive-nhs-hexbin-wrapper').node()

const isMobile = window.matchMedia('(max-width: 600px)').matches;

let width = atomEl.getBoundingClientRect().width;
let height = width  * 1.3;

var svg = d3.select("svg")
.attr('width', width)
.attr('height', height)

var parseDate = d3.timeParse("%x");

var color = d3.scaleTime()
    .domain([new Date(1962, 0, 1), new Date(2006, 0, 1)])
    .range(["black", "steelblue"])
    .interpolate(d3.interpolateLab);

var hexbin = d3.hexbin()
    .extent([[0, 0], [width, height]])
    .radius(10);

var radius = d3.scaleSqrt()
    .domain([0, 12])
    .range([0, 10]);

// Per https://github.com/topojson/us-atlas
var projection = d3.geoAlbersUsa()
    .scale(1280)
    .translate([480, 300]);

var path = d3.geoPath();

d3.queue()
    .defer(d3.json, "https://d3js.org/us-10m.v1.json")
    .defer(d3.tsv, "walmart.tsv", typeWalmart)
    .await(ready);

function ready(error, us, walmarts) {
  if (error) throw error;

  svg.append("path")
      .datum(topojson.feature(us, us.objects.nation))
      .attr("class", "nation")
      .attr("d", path);

  svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "states")
      .attr("d", path);

  svg.append("g")
      .attr("class", "hexagon")
    .selectAll("path")
    .data(hexbin(walmarts).sort(function(a, b) { return b.length - a.length; }))
    .enter().append("path")
      .attr("d", function(d) { return hexbin.hexagon(radius(d.length)); })
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr("fill", function(d) { return color(d3.median(d, function(d) { return +d.date; })); });
}

function typeWalmart(d) {
  var p = projection(d);
  d[0] = p[0], d[1] = p[1];
  d.date = parseDate(d.date);
  return d;
}
