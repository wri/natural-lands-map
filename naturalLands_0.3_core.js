/*
NATURAL LANDS MAP FOR SBTN NO CONVERSION TARGET SETTING
Version 0.3 (beta)
WRI, April 2023
Full Technical Note: https://sciencebasedtargetsnetwork.org/wp-content/uploads/2023/05/Technical-Guidance-2023-Step3-Land-v0.3-Natural-Lands-Map.pdf
Full Target Guidance (section 1.2.2. explains the Core Natural Lands):
https://sciencebasedtargetsnetwork.org/wp-content/uploads/2023/05/Technical-Guidance-2023-Step3-Land-v0.3.pdf

CREATION OF 'CORE' NATURAL LANDS LAYER
This script compiles the layers that determine the 'core' classification.
The Natural Land is then overlayed with 'core' designating 'core natural land.' 
See script titled naturalLands_0.3 for full Natural Lands map compilation process
*/


var umdLC = ee.Image('projects/glad/GLCLU2020/LCLUC_2020');
var umdProj = umdLC.projection();


//// Critical Natural Assets-----------------------------------------
// 1= local, 2= global, 3= overlap
var criticalNatAssets = ee.Image('projects/wri-datalab/SBTN/core/criticalNaturalAssets');


//// Minimum land area requiring conservation-----------------------------------------
var min_landArea_forConservation = ee.FeatureCollection('projects/wri-datalab/SBTN/core/min_landArea_forConservation');
var global_poly = ['00130000000000000006','00130000000000000007','00130000000000000001','00130000000000000000','00130000000000000005'];
var min_landArea_forConservation_poly = min_landArea_forConservation.filter(ee.Filter.inList('system:index',global_poly).not());

// convert the vector to raster
var min_landArea_forConservation_poly = min_landArea_forConservation_poly.map(function(feat) {
  return feat.set('bioID',1);
});
var min_landArea_forConservation = min_landArea_forConservation_poly.reduceToImage(['bioID'], ee.Reducer.first()).reproject({crs:umdProj});
var landforConservation = ee.Image('projects/wri-datalab/SBTN/core/land_forConservation');

//// Soil Biodiversity: Richness & Dissimilarity----------------------------------------
var soilRich = ee.Image('projects/wri-datalab/SBTN/core/soilBiodiversity/top5p100_rich_hotspots');
var soilDiss = ee.Image('projects/wri-datalab/SBTN/core/soilBiodiversity/top5p100_diss_hotspots');
var soiltop5 = ee.ImageCollection([soilDiss.updateMask(soilDiss.eq(10)),soilRich.updateMask(soilRich.eq(1))]).mosaic().gt(0);

//// IUCN Red List----------------------------------------
// South Africa
var IUCN_SA = ee.Image('projects/wri-datalab/SBTN/core/IUCN/iucn_SouthAfrica');

// North America
var na_iucn = ee.Image('projects/wri-datalab/SBTN/core/IUCN/NorthAmerica_IUCN_RLE');
var na_iucn_CR = na_iucn.remap([7112,7117,7120,7133,7142,7151,7333,7336,7337,7351,7371,7375,7394,7395,7397,7411,7412,7415,7417,7420,7421,7422,7428,7430,7431,7434,7450,7451,7458,7461,7487,7507,7513,7518,9026,9287,10005,10075,7096,7322,7349,7510,9187,],
                               [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,]);
var na_iucn_EN = na_iucn.remap([6159,7013,7014,7074,7077,7092,7122,7129,7130,7303,7304,7307,7311,7313,7314,7316,7317,7320,7323,7324,7325,7327,7328,7329,7330,7334,7335,7338,7343,7346,7347,7348,7352,7355,7356,7357,7361,7364,7368,7378,7379,7380,7382,7387,7400,7401,7407,7410,7425,7429,7437,7446,7449,7452,7453,7454,7456,7459,7468,7485,7486,7501,7503,7506,7517,7522,7525,7668,9003,9041,9065,9105,9138,9140,9174,9175,9179,9180,9183,9188,9197,9198,9230,9240,9282,10086,10087,10088,10095,10611,10763,12000,],
                               [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,]);
var na_iucn_VU = na_iucn.remap([7008,7009,7015,7021,7022,7031,7035,7036,7037,7039,7051,7054,7079,7084,7094,7097,7100,7104,7105,7110,7118,7121,7125,7128,7131,7132,7134,7137,7141,7147,7153,7170,7172,7177,7179,7305,7306,7308,7309,7310,7315,7318,7321,7326,7331,7340,7342,7350,7353,7354,7360,7362,7366,7367,7369,7370,7376,7381,7383,7409,7414,7423,7426,7435,7445,7447,7457,7467,7482,7483,7488,7489,7519,7523,7663,7873,7879,7881,9002,9032,9047,9051,9056,9063,9073,9082,9102,9106,9112,9117,9130,9136,9137,9141,9173,9178,9211,9216,9233,9248,9275,9284,10016,10022,10023,10077,10093,10096,10236,10607,10610,],
                               [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,]);
var IUCN_NA = ee.ImageCollection([na_iucn_CR,na_iucn_EN,na_iucn_VU]).mosaic().rename(['constant']);

//// Irrecoverable carbon----------------------------------------
var ic = ee.Image('projects/ci_geospatial_assets/CIE/Final_Assets/Irrecoverable_Carbon_Total_2018_30m');
var palette = ["#fcd6d2","#faacb9","#f768a1","#cf298f","#8c007a","#49006b"];
var irrCarbon_15 = ic.gte(15).selfMask();

//// Natural Forests from the SBTN Natural Lands map----------------------------------------
var naturalLands = ee.Image('projects/wri-datalab/SBTN/natLands_beta/naturalLands_allClasses_20230516');
var natural = naturalLands.lt(12).selfMask();
var natForests = naturalLands.eq(2).or(naturalLands.eq(8)).or(naturalLands.eq(9)).selfMask();


/////////////////////////////////////////
//// Combine layers into one image
/////////////////////////////////////////
var image = ee.Image(1);
var core = image.where(criticalNatAssets.gte(1),2);
var core = core.where(landforConservation.eq(1),3);
var core = core.where(soiltop5.eq(1),4);
var core = core.where(natForests.eq(1),5);
var core = core.where(IUCN_SA.eq(1),6);
var core = core.where(IUCN_NA.eq(1),6);
var core = core.where(irrCarbon_15.eq(1),7);
var core = core.updateMask(natural);
Map.addLayer(natural.selfMask(),{palette:'a8ddb5'},'Natural Lands',0);

var natural_and_core = naturalLands.where(naturalLands,1);
var natural_and_core = natural_and_core.where(natural.eq(1).and(core.gt(1)),2);
var natural_and_core = natural_and_core.where(natural.and(core.gt(1).not()),3).selfMask();
Map.addLayer(natural_and_core,{min:1,max:3, palette:['D3D3D3','2b6639','a8ddb5',]},'natural and core',0);



///// EXPORT ////
var world = ee.Geometry.BBox(-179.9, -60, 180, 75);
var cords = umdProj.getInfo();

var exportImage = function(image,region,name){
  Export.image.toAsset({
    image:image, 
    description:'SBTN_'+name, 
    assetId:'projects/wri-datalab/SBTN/natLands_beta/'+name, 
    pyramidingPolicy:'sample', 
    region:region, 
    crs:cords['crs'],
    crsTransform: cords['transform'],
    maxPixels:1e13
  });
};

//example:
// exportImage(natural_and_core,world,'naturalLands_core_20230516');



///////////////////////////////////////////////////////
/// LEGEND
///////////////////////////////////////////////////////
var palette = [
 "2b6639",  // core natural
 "a8ddb5",  // natural
 "D3D3D3",  // non-natural
 ]

var legend_colors = palette;
var legend_keys = ['Core Natural', 'Natural', 'Non-Natural', ]

// Adding a legend as a small rectangular panel in the Map view:
// Set position of panel
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// Create legend title
var legendTitle = ui.Label({
  value: 'Natural Lands - Classes',
  style: {
    fontWeight: 'bold',
    fontSize: '12px',
    margin: '0 0 4px 0',
    padding: '0'
    }
});

// Add the title to the panel
legend.add(legendTitle);
    
// Create and style 1st row of the legend.
var makeRow = function(color, name) {
      
      // Create the label that is the colored box:
      var colorBox = ui.Label({
        style: {
          backgroundColor: '#' + color,
          // Use padding to give the box height and width.
          padding: '8px',
          margin: '0 0 4px 0'
        }
      });
      
      // Create the label filled with the description text:
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 4px 6px',
                fontSize: '12px'
        }
      });
      
      // return the panel
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
};

//  Specify palette with the colors
var palette2=legend_colors;

// Name of the legend
var names = legend_keys;
// Add color and and names (i< should be less than number of classes)
for (var i = 0; i < 3; i++) {
  legend.add(makeRow(palette2[i], names[i]));
  }  

// add legend to map  
Map.add(legend); 




/////////// light basemap ///////////
var lightBasemap = [
  {
    featureType: 'administrative',
    elementType: 'all',
    stylers: [{color:'#5c5c5c'},{visibility: 'off'}]
  },
  {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{visibility: 'off'}]
  },
  {
    featureType: 'landscape',
    elementType: 'all',
    stylers: [{color: '#e4e2dd'}, {visibility: 'on'}]
    // stylers: [{color: '#2b2b2b'}, {visibility: 'on'}]
  },
  {featureType: 'poi', elementType: 'all', stylers: [{visibility: 'off'}]}, {
    featureType: 'road',
    elementType: 'all',
    stylers: [{visibility: 'off'}]
  },
  {
    featureType: 'water',
    elementType: 'all',
    stylers: [{color: '#ffffff'}, {visibility: 'on'}]
    // stylers: [{color: '#6BAED6'}, {visibility: 'on'}]
  }
];


Map.setOptions(
    'lightBasemap', {lightBasemap: lightBasemap});