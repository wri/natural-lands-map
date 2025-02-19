/*
VALIDATION OF NATURAL LANDS MAP FOR SBTN NO CONVERSION TARGET SETTING
Version 1.0
WRI, August 2024
Full methodology in the technical note here: https://sciencebasedtargetsnetwork.org/wp-content/uploads/2024/09/Technical-Guidance-2024-Step3-Land-v1-Natural-Lands-Map.pdf


This script calculates the accuracy of the binary (natural, non-natural) map.

Validation points were collected in grids of 9 points, and the label that was used the most for each grid
(aka majority label) was used in the accuracy assessment
*/

var binary = ee.Image('WRI/SBTN/naturalLands/v1/2020').select(['natural']).remap([0,1], [2,1]).rename(['constant']); 
var allClasses = ee.Image('WRI/SBTN/naturalLands/v1/2020').select(['classification']); 

var binaryProj = binary.projection();


/////////////////////////
////// VALIDATION //////
/////////////////////////


var points = ee.FeatureCollection('projects/wri-datalab/SBTN/validation/natecosystems_validationdataset_16032023');

var natural = points.filter(ee.Filter.eq('long_description','Natural ecosystems'));
var notNatural = points.filter(ee.Filter.eq('long_description','Non-natural ecosystems'));
var notSure = points.filter(ee.Filter.eq('long_description','Not sure'));

Map.addLayer(natural,{color:'green'},'natural');
Map.addLayer(notNatural,{color:'gray'},'notNatural');
Map.addLayer(notSure,{color:'black'},'notSure');


/// set 1=natural, 2=not natural, 3=not sure
var naturalPts = natural.map(function(feat) {
  return feat.set('class',1);
});
var notNaturalPts = notNatural.map(function(feat) {
  return feat.set('class',2);
});
var notSurePts = notSure.map(function(feat) {
  return feat.set('class',3);
});
var allPts = naturalPts.merge(notNaturalPts).merge(notSurePts);


//// function that filters to the id, gets the majority value from the 3x3 grid of points, 
// and then assigns that label to the middle point. 

var ids = allPts.aggregate_array('sampleid').distinct();

var validation = ee.FeatureCollection([]);

////// majority value
function majority(id){

  // filter to one sampleid
  var grid = allPts.filter(ee.Filter.eq('sampleid',id));
  // get the class values in a list
  var values = grid.aggregate_array('class');
  // get the mode class
  var mode = values.reduce(ee.Reducer.mode());
  
  // get the rowids in a list
  var rowids = grid.aggregate_array('rowid');
  // get the middle rowid 
  var middleID = rowids.reduce(ee.Reducer.median());
  // select the middle point
  var middle_pt = grid.filter(ee.Filter.eq('rowid',middleID));
  // re-label the middle point to the majority label
  var middle_reclass = middle_pt.set('class',mode);
  
  return middle_reclass;
}

var validation_pts_majority = ee.FeatureCollection(ids.map(majority)).flatten();
// Export this ^ to make the script run faster 

Export.table.toAsset({
    collection:validation_pts_majority, 
    description:'validation_pts_majority', 
    assetId:'SBTN/validation_pts_majority'});


// then import the new featureCollection
var validation_pts = ee.FeatureCollection('projects/wri-datalab/SBTN/validation/validation_pts_majority');
print('majority validation set size:',validation_pts.size());

var binary_sample_pts = binary.sampleRegions(validation_pts, ['sample_id','class'],30, binaryProj);
print('Example sample point:',binary_sample_pts.first());
print('Number of sample points:',binary_sample_pts.size());

var accuracy = binary_sample_pts.errorMatrix('class', 'constant');
print ('Validation: error matrix',accuracy);
print ('Validation: overall accuracy: ', accuracy.accuracy());
print ('Validation: consumers accuracy: ', accuracy.consumersAccuracy());
print ('Validation: producers accuracy: ', accuracy.producersAccuracy());


////
// Calculate how many of the validation points were labeled 'not sure'
var notSure = binary_sample_pts.filter(ee.Filter.equals('class',3));
print('Number of points labeled "not sure"',notSure.size(),'Percentage of sample pts "unsure":',notSure.size().divide(binary_sample_pts.size()).multiply(100));


