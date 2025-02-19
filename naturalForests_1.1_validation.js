/*
VALIDATION OF SBTN NATURAL LANDS MAP FOREST CLASS
Version 1.1 
WRI, February 2025

This script calculates the accuracy of the natural forest (natural forest, other) class.

Validation points were collected in grids of 9 points, and both the label that was used the most for each grid
(aka majority label), and the label of the middle pixel were used in the accuracy assessment
*/

var naturalLands = ee.Image('projects/wri-datalab/SBTN/natLands_v1_1/naturalLands_v1_1_2bands_20250203');

var binary = naturalLands.select(['natural']).remap([0,1], [2,1]).rename(['constant']); 
var allClasses = naturalLands.select(['classification']); 
var natForests = allClasses.remap([2,5,8,9],[2,5,8,9]).gt(0).unmask().remap([0,1],[2,1]).rename(['constant']);

var binaryProj = binary.projection();


/////////////////////////
////// VALIDATION //////
/////////////////////////

var localPoints = ee.FeatureCollection('projects/wri-datalab/SBTN/validation/natural_forests_validation_localmaps_010625');

Map.addLayer(localPoints,{},'localPoints',0);

// Split the validation points into the three possible classes (natural forests, other, not sure)
var natural = localPoints.filter(ee.Filter.eq('item_name','Natural forests'));
var other = localPoints.filter(ee.Filter.inList('item_name',['Other land cover', 'Other woodland',
'Woody plantations and planted forests', 'Trees in agriculture','Trees in urban/built up areas','Not sure about tree height']));
var notSure = localPoints.filter(ee.Filter.eq('item_name','Not sure'));

Map.addLayer(natural,{color:'green'},'natural',0);
Map.addLayer(other,{color:'gray'},'other',0);
Map.addLayer(notSure,{color:'black'},'notSure',0);


/// set 1=natural, 2=other, 3=not sure
var naturalPts = natural.map(function(feat) {
  return feat.set('class',1);
});
var otherPts = other.map(function(feat) {
  return feat.set('class',2);
});
var notSurePts = notSure.map(function(feat) {
  return feat.set('class',3);
});
var allPts = naturalPts.merge(otherPts).merge(notSurePts);



// Function that retrieves the majority label from the 9 sub-points 
// as well as the middle point label. 
// Assigns those two values to new properties (class and class2)

var retrieveLabel = function(pt){
  // get the sample id
  var sampleid = pt.get('sampleid');
  var rowid = pt.get('rowid');
  // get all the sub-points with that sampleid
  var grid = allPts.filter(ee.Filter.eq('sampleid',sampleid));
  // make a list of the class labels for the subpoints
  var values = grid.aggregate_array('class');
  // take the majority (mode) class label
  var mode = values.reduce(ee.Reducer.mode());
  
  // get the middle pixel label as well
  var middleValue = grid.filter(ee.Filter.eq('middlePt',1)).first().get('class');

  return pt.set({'class':mode,'class2':middleValue});
};

// The validation points have a 'middlePt' column with a flag for the middle sub-points
var middlePts = allPts.filter(ee.Filter.eq('middlePt',1));

// apply the retrieveLabel function to the middle points
var validation_pts_all = middlePts.map(retrieveLabel);

// filter out the 'not sure' pixels
var validation_pts = validation_pts_all.filter(ee.Filter.or(ee.Filter.neq('class',3),ee.Filter.neq('class2',3)));


//// Setting up confusion matrix mannually //////
var natForests_sample_pts = natForests.sampleRegions(validation_pts, ['sampleid','class','class2'],30, binaryProj);
print('validation sampled ex',natForests_sample_pts.first());

// pts where map=1 and ref(majority OR middle)=1
var natCorrect2 = natForests_sample_pts.filter(ee.Filter.and(ee.Filter.eq('constant',1),
                    ee.Filter.or(ee.Filter.eq('class',1),ee.Filter.eq('class2',1))));
print('naturalMap x naturalRef(both)',natCorrect2.size());
// pts where map=1 and ref(majority OR middle)=2
var natIncorrect2 = natForests_sample_pts.filter(ee.Filter.and(ee.Filter.eq('constant',1),
                      ee.Filter.and(ee.Filter.neq('class',1),ee.Filter.neq('class2',1))));
print('naturalMap x otherRef(both)',natIncorrect2.size());

// pts where map=2 and ref(majority OR middle)=2
var otherCorrect2 = natForests_sample_pts.filter(ee.Filter.and(ee.Filter.eq('constant',2),
                      ee.Filter.or(ee.Filter.eq('class',2),ee.Filter.eq('class2',2))));
print('otherMap x otherRef(both)',otherCorrect2.size());
// pts where map=2 and ref(majority OR middle)=1
var otherIncorrect2 = natForests_sample_pts.filter(ee.Filter.and(ee.Filter.eq('constant',2),
                        ee.Filter.and(ee.Filter.neq('class',2),ee.Filter.neq('class2',2))));
print('otherMap x naturalRef(both)',otherIncorrect2.size());


////
// Calculate how many of the validation points were labeled 'not sure'
var notSure = validation_pts_all.filter(ee.Filter.or(ee.Filter.eq('class',3),ee.Filter.eq('class2',3)));
print('Number of points labeled "not sure"',notSure.size(),'Percentage of sample pts "unsure":',notSure.size().divide(validation_pts_all.size()).multiply(100));
