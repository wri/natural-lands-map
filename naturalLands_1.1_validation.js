/*
VALIDATION OF NATURAL LANDS MAP FOR SBTN NO CONVERSION TARGET SETTING
Version 1.1
WRI, February 2025 

This script calculates the accuracy of the binary (natural, non-natural) map.

Validation points were collected in grids of 9 points, and both the label of the middle pixel and the label that was used the 
most for each grid (aka majority label) were used in the accuracy assessment
*/


var naturalLands = ee.Image('projects/wri-datalab/SBTN/natLands_v1_1/naturalLands_v1_1_2bands_20250203');

var binary = naturalLands.select(['natural']).remap([0,1], [2,1]).rename(['constant']);
var allClasses = naturalLands.select(['classification']); 

var binaryProj = binary.projection();


/////////////////////////
////// VALIDATION //////
/////////////////////////


var points = ee.FeatureCollection('projects/wri-datalab/SBTN/validation/natecosystems_validationdataset_012325'); 

// Split the validation points into the three possible classes (natural, non-natural, not sure)
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


// Function that retrieves the majority label from the 9 sub-points 
// as well as the middle point label. 
// Assigns those two values to new properties (class and class2)

function retrieveLabel(pt){
  // each set of 9 points has a sampleid
  var sampleid = pt.get('sampleid');
  // each sub-point has a rowid
  var rowid = pt.get('rowid');
  // get all the sub-points with that sampleid
  var grid = allPts.filter(ee.Filter.eq('sampleid',sampleid));
  // make a list of the class labels for the subpoints
  var values = grid.aggregate_array('class');
  // take the majority (mode) class label
  var mode = values.reduce(ee.Reducer.mode());
  
  // get the middle point label as well 
  var middleValue = grid.filter(ee.Filter.eq('middlePt',1)).first().get('class');
  
  return pt.set({'class':mode,'class2':middleValue});
}

// The validation points have a 'middlePt' column with a flag for the middle sub-points
var middlePts = allPts.filter(ee.Filter.eq('middlePt',1));

// apply the retrieveLabel function to the middle points
var validation_pts_all = middlePts.map(retrieveLabel);

// filter out the 'not sure' pixels
var validation_pts = validation_pts_all.filter(ee.Filter.or(ee.Filter.neq('class',3),ee.Filter.neq('class2',3)));


//// Setting up confusion matrix mannually /////
var binary_sample_pts = binary.sampleRegions(validation_pts, ['sampleid','class','class2'],30, binaryProj);
print('validation sampled ex',binary_sample_pts.first());

// pts where map=1 and ref(majority OR middle)=1
var natCorrect2 = binary_sample_pts.filter(ee.Filter.and(ee.Filter.eq('constant',1),
                    ee.Filter.or(ee.Filter.eq('class',1),ee.Filter.eq('class2',1))));
print('naturalMap x naturalRef(both)',natCorrect2.size());
// pts where map=1 and ref(majority OR middle)=2
var natIncorrect2 = binary_sample_pts.filter(ee.Filter.and(ee.Filter.eq('constant',1),
                      ee.Filter.and(ee.Filter.neq('class',1),ee.Filter.neq('class2',1))));
print('naturalMap x notNatRef(both)',natIncorrect2.size());

// pts where map=2 and ref(majority OR middle)=2
var notNatCorrect2 = binary_sample_pts.filter(ee.Filter.and(ee.Filter.eq('constant',2),
                      ee.Filter.or(ee.Filter.eq('class',2),ee.Filter.eq('class2',2))));
print('notNatMap x notNatRef(both)',notNatCorrect2.size());
// pts where map=2 and ref(majority OR middle)=1
var notNatIncorrect2 = binary_sample_pts.filter(ee.Filter.and(ee.Filter.eq('constant',2),
                        ee.Filter.and(ee.Filter.neq('class',2),ee.Filter.neq('class2',2))));
print('notNatMap x naturalRef(both)',notNatIncorrect2.size());


////
// Calculate how many of the validation points were labeled 'not sure'
var notSure = validation_pts_all.filter(ee.Filter.or(ee.Filter.eq('class',3),ee.Filter.eq('class2',3)));
print('Number of points labeled "not sure"',notSure.size(),'Percentage of sample pts "unsure":',notSure.size().divide(validation_pts_all.size()).multiply(100));


