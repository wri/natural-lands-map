/*
NATURAL LANDS MAP FOR SBTN NO CONVERSION TARGET SETTING
Version 0.3 (beta)
WRI, April 2023
Full Technical Note: https://sciencebasedtargetsnetwork.org/wp-content/uploads/2023/05/Technical-Guidance-2023-Step3-Land-v0.3-Natural-Lands-Map.pdf

NEW ZEALAND LUCAS PRE-PROCESSING
This script harmonizes NZ LUCAS data to Natural Lands map classes, mosaics, and exports the data.
The harmonized layer is then incorporated into the Natural Lands map. 
See script titled naturalLands_0.3 for full Natural Lands map compilation process
*/

var nz = ee.FeatureCollection('projects/wri-datalab/SBTN/Local_data/lucas-nz-land-use-map-1990-2008-2012-2016-v011');

// create featureCollection for each land cover 
var new1 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',71),(ee.Filter.eq('SUBID_2016',120))));
var new2 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',71),(ee.Filter.eq('SUBID_2016',121))));
var new3 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',71),(ee.Filter.eq('SUBID_2016',122))));
var new10 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',72),(ee.Filter.eq('SUBID_2016',0))));
var new11 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',72),(ee.Filter.eq('SUBID_2016',201))));
var new12 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',72),(ee.Filter.eq('SUBID_2016',202))));
var new13 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',72),(ee.Filter.eq('SUBID_2016',203))));
var new20 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',73),(ee.Filter.eq('SUBID_2016',122))));
var new21 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',73),(ee.Filter.eq('SUBID_2016',201))));
var new22 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',73),(ee.Filter.eq('SUBID_2016',202))));
var new23 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',73),(ee.Filter.eq('SUBID_2016',203))));
var new24 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',73),(ee.Filter.eq('SUBID_2016',204))));
var new30 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',74),(ee.Filter.eq('SUBID_2016',0))));
var new31 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',75),(ee.Filter.eq('SUBID_2016',0))));
var new32 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',75),(ee.Filter.eq('SUBID_2016',502))));
var new33 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',75),(ee.Filter.eq('SUBID_2016',503))));
var new34 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',75),(ee.Filter.eq('SUBID_2016',504))));
var new35 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',76),(ee.Filter.eq('SUBID_2016',0))));
var new36 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',76),(ee.Filter.eq('SUBID_2016',502))));
var new37 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',76),(ee.Filter.eq('SUBID_2016',503))));
var new38 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',76),(ee.Filter.eq('SUBID_2016',504))));
var new40 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',77),(ee.Filter.eq('SUBID_2016',0))));
var new41 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',78),(ee.Filter.eq('SUBID_2016',0))));
var new50 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',79),(ee.Filter.eq('SUBID_2016',0))));
var new51 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',79),(ee.Filter.eq('SUBID_2016',901))));
var new52 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',79),(ee.Filter.eq('SUBID_2016',902))));
var new60 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',80),(ee.Filter.eq('SUBID_2016',0))));
var new61 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',80),(ee.Filter.eq('SUBID_2016',1001))));
var new70 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',81),(ee.Filter.eq('SUBID_2016',0))));
var new80 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2016',82),(ee.Filter.eq('SUBID_2016',0))));

var groups = ee.List([new1,new2,new3,new10,new11,new12,new13,new20,new21,new22,new23,new24,new30,new31,new32,new33,
                      new34,new35,new36,new37,new38,new40,new41,new50,new51,new52,new60,new61,new70,new80]);

var values = ee.List([1,2,3,10,11,12,13,20,21,22,23,24,30,31,32,33,34,35,36,37,38,40,41,50,51,52,60,61,70,80]);

var newCollection = ee.FeatureCollection([]);

// assign new land cover class numbers and put into one featureCollection
var flattened = groups.map(function(group){
  var index = groups.indexOf(group);
  var value = values.get(index);
  var remapped = ee.FeatureCollection(group).map(function(feat){
    return ee.Feature(feat).set('newClass',value);
  });
  return remapped;
});

var newNZ = ee.FeatureCollection(flattened).flatten();

var umdLC = ee.Image('projects/glad/GLCLU2020/LCLUC_2020');
var umdProj = umdLC.projection();

// reduce featureCollection to image 
var nzLC = newNZ.reduceToImage(['newClass'], ee.Reducer.first()).reproject({crs:umdProj});
Map.addLayer(nzLC,{min:1,max:80},'nzLC');
print(nzLC);


///////////////////////////////////////////////////////
/// EXPORT THE IMAGE
///////////////////////////////////////////////////////
var world = ee.Geometry.BBox(-179.9, -60, 180, 75);
var geometry = ee.Geometry.BBox(162.0172,-51.24115,185.83563,-32.62995);
var cords = umdProj.getInfo();

var exportImage = function(image,region){
  Export.image.toAsset({
    image:image, 
    description:'newZealand_LC_remapped', 
    assetId: 'SBTN/newZealand_LC_remapped', 
    pyramidingPolicy:'sample', 
    region:region, 
    crs: cords['crs'], 
    crsTransform: cords['transform'], 
    maxPixels:1e13 
  });
};

//exportImage(nzLC,geometry);