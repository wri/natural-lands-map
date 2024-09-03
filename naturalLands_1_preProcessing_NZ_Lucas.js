 /*
NATURAL LANDS MAP FOR SBTN NO CONVERSION TARGET SETTING
Version 1.0 
WRI, August 2024
Full Technical Note: https://sciencebasedtargetsnetwork.org/wp-content/uploads/2024/09/Technical-Guidance-2024-Step3-Land-v1-Natural-Lands-Map.pdf


NEW ZEALAND LUCAS PRE-PROCESSING
This script harmonizes NZ LUCAS 2020 data to Natural Lands map classes, mosaics, and exports the data.
The harmonized layer is then incorporated into the Natural Lands map. 
See script titled naturalLands_1 for full Natural Lands map compilation process
*/

var nz = ee.FeatureCollection('projects/wri-datalab/SBTN/Local_data/lucas-nz-land-use-map-2020-v003');


// create featureCollection for each land cover 
var new1 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','71 - Natural Forest'),(ee.Filter.eq('SUBID_2020','120 - Shrubland'))));
var new2 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','71 - Natural Forest'),(ee.Filter.eq('SUBID_2020','121 - Tall Forest'))));
var new3 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','71 - Natural Forest'),(ee.Filter.eq('SUBID_2020','122 - Wilding trees'))));
var new10 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','72 - Planted Forest - Pre 1990'),(ee.Filter.eq('SUBID_2020','0 - Unknown'))));
var new11 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','72 - Planted Forest - Pre 1990'),(ee.Filter.eq('SUBID_2020','201 - Pinus radiata'))));
var new12 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','72 - Planted Forest - Pre 1990'),(ee.Filter.eq('SUBID_2020','202 - Douglas fir'))));
var new13 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','72 - Planted Forest - Pre 1990'),(ee.Filter.eq('SUBID_2020','203 - Unspecified exotic species'))));
var new20 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','73 - Post 1989 Forest'),(ee.Filter.eq('SUBID_2020','122 - Wilding trees'))));
var new21 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','73 - Post 1989 Forest'),(ee.Filter.eq('SUBID_2020','201 - Pinus radiata'))));
var new22 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','73 - Post 1989 Forest'),(ee.Filter.eq('SUBID_2020','202 - Douglas fir'))));
var new23 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','73 - Post 1989 Forest'),(ee.Filter.eq('SUBID_2020','203 - Unspecified exotic species'))));
var new24 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','73 - Post 1989 Forest'),(ee.Filter.eq('SUBID_2020','204 - Regenerating natural species'))));
var new30 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','74 - Grassland - With woody biomass'),(ee.Filter.eq('SUBID_2020','0 - Unknown'))));
var new31 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','75 - Grassland - High producing'),(ee.Filter.eq('SUBID_2020','0 - Unknown'))));
var new32 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','75 - Grassland - High producing'),(ee.Filter.eq('SUBID_2020','502 - Grazed - dairy'))));
var new33 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','75 - Grassland - High producing'),(ee.Filter.eq('SUBID_2020','503 - Grazed - non-dairy'))));
var new34 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','75 - Grassland - High producing'),(ee.Filter.eq('SUBID_2020','504 - Ungrazed'))));
var new35 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','76 - Grassland - Low producing'),(ee.Filter.eq('SUBID_2020','0 - Unknown'))));
var new36 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','76 - Grassland - Low producing'),(ee.Filter.eq('SUBID_2020','502 - Grazed - dairy'))));
var new37 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','76 - Grassland - Low producing'),(ee.Filter.eq('SUBID_2020','503 - Grazed - non-dairy'))));
var new38 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','76 - Grassland - Low producing'),(ee.Filter.eq('SUBID_2020','504 - Ungrazed'))));
var new40 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','77 - Cropland - Orchards and vineyards (perennial)'),(ee.Filter.eq('SUBID_2020','0 - Unknown'))));
var new41 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','78 - Cropland - Annual'),(ee.Filter.eq('SUBID_2020','0 - Unknown'))));
var new50 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','79 - Wetland - Open water'),(ee.Filter.eq('SUBID_2020','0 - Unknown'))));
var new51 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','79 - Wetland - Open water'),(ee.Filter.eq('SUBID_2020','901 - Naturally occurring'))));
var new52 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','79 - Wetland - Open water'),(ee.Filter.eq('SUBID_2020','902 - Human induced'))));
var new60 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','80 - Wetland - Vegetated non forest'),(ee.Filter.eq('SUBID_2020','0 - Unknown'))));
var new61 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','80 - Wetland - Vegetated non forest'),(ee.Filter.eq('SUBID_2020','1001 - Peat mine'))));
var new70 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','81 - Settlements or built-up area'),(ee.Filter.eq('SUBID_2020','0 - Unknown'))));
var new80 = nz.filter(ee.Filter.and(ee.Filter.eq('LUCID_2020','82 - Other'),(ee.Filter.eq('SUBID_2020','0 - Unknown'))));

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
Map.addLayer(nzLC,{min:1,max:80},'nzLC',0);
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
    description:'newZealand_LC_2020_reprojected', 
    assetId: 'SBTN/map/newZealand_LC_2020_reprojected', 
    pyramidingPolicy:'sample', 
    region:region, 
    crs: cords['crs'], 
    crsTransform: cords['transform'], 
    maxPixels:1e13 
  });
};

//exportImage(nzLC,geometry);
