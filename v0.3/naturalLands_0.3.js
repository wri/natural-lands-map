/*
NATURAL LANDS MAP FOR SBTN NO CONVERSION TARGET SETTING
Version 0.3 (beta)
WRI, April 2023
Full Technical Note: https://sciencebasedtargetsnetwork.org/wp-content/uploads/2023/05/Technical-Guidance-2023-Step3-Land-v0.3-Natural-Lands-Map.pdf
This script has the complete process for compiling a map of natural lands in 2020.
As is, this script will only run when very zoomed in due to the need to reproject many input layers. 
We used this in sections by creating layers that we needed, 
and then exporting where .reprojection() is needed. 
*/


///////////////////////////////////////////////////////
/// LOAD BASE LAND COVER DATA ////
///////////////////////////////////////////////////////


//// UMD Land Cover--------------------------------------------------------------------------
// We used the individual land cover classes when available.
var umdSnow = ee.Image("projects/glad/GLCLU2020/Snow_2020").selfMask();
var umdCrop = ee.Image("projects/glad/GLCLU2020/Cropland_2019").selfMask();
var umdBuilt = ee.Image("projects/glad/GLCLU2020/Builtup_type").selfMask(); // 1=stable(2000-2020) 2=gain. 1&2 = 2020 extent
var umdVegFraction = ee.Image("projects/glad/GLCLU2020/Vegetation_cover_2020").gte(1); // 1-100 percent cover
var treeHeight = ee.Image('projects/glad/GLCLU2020/Forest_height_2020');
var umdForest = treeHeight.gte(5); //Apply minimum height threshold of greater than or equal to 5m

var landmask = ee.Image("projects/glad/landBuffer4").mask();
var umdWater = ee.Image('projects/glad/GLCLU2020/Water_2020').updateMask(landmask).selfMask();
var umdWater20 = umdWater.gte(20); //Apply threshold to only include water present 20% of the year or more
var water_natural = umdWater20.gte(1);

// We used the composite land cover map for classes that don't have individual assets (bare & wetland classes)
var umdLC = ee.Image('projects/glad/GLCLU2020/LCLUC_2020');
// re-map the 255 values into 10 land cover classes:
// 0=bare, 1=shortVeg, 2=forest, 3=tallForest, 4=wetShortVeg, 5=wetForest, 6=water, 7=ice, 8=crop, 9=built
var umd2020 = umdLC.remap([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,	26,	27,	28,	29,	30,	31,	32,	33,	34,	35,	36,	37,	38,	39,	40,	41,	42,	43,	44,	45,	46,	47,	48,100,	101,	102,	103,	104,	105,	106,	107,	108,	109,	110,	111,	112,	113,	114,	115,	116,	117,	118,	119,	120,	121,	122,	123,	124,	125,	126,	127,	128,	129,	130,	131,	132,	133,	134,	135,	136,	137,	138,	139,	140,	141,	142,	143,	144,	145,	146,	147,	148,200,	201,	202,	203,	204,	205,	206,	207,241,  244,  250],
                          [0,1,1,1,1,1,1,1,1,1,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 , 2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	3,	3,	3,	3,	3,	3,	3,4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,6,	6,	6,	6,	6,	6,	6,	6,7,8,9]);
var umd_remapVis = {min:0,max:9,palette:["FEFECC","B9B91E","347834","0D570D","88CAAD","589558","6baed6","acd1e8","fff183","e8765d"]};
Map.addLayer(umd2020,umd_remapVis,'UMD LC 2020',0);

var umdBare = umd2020.eq(0);
var umdShortVeg = umd2020.eq(1).or(umd2020.eq(4));
var umdWetVeg = umd2020.eq(4);
var umdWetTrees = umd2020.eq(5);

var umdProj = umdLC.projection();


//// ESA WorldCover--------------------------------------------------------------------------
var worldCover = ee.ImageCollection("ESA/WorldCover/v100").first();
// 10 = Trees, 20 = Shrubland, 30 = Grassland, 40 = Cropland, 50 = Built-up, 60 = Barren / sparse vegetation
// 70 = Snow and ice, 80 = Open water, 90 = Herbaceous wetland, 95	= Mangroves, 100 = Moss and lichen
Map.addLayer(worldCover,{bands:['Map']},'ESA WorldCover',0);

var wcProj = worldCover.projection();

var wcGrass = worldCover.updateMask(worldCover.eq(30)).rename(['b1']);
var wcShrub = worldCover.updateMask(worldCover.eq(20)).rename(['b1']);
var wcWetland = worldCover.updateMask(worldCover.eq(90)).rename(['b1']);
var wcMoss = worldCover.updateMask(worldCover.eq(100)).rename(['b1']);
var wcBare = worldCover.updateMask(worldCover.eq(60)).rename(['b1']);
var wcSnow = worldCover.updateMask(worldCover.eq(70)).rename(['b1']);

// Mosaic WC grass, shrub, and wetland classes to form a short vegetation class
var wcShortVeg = ee.ImageCollection([wcGrass,wcShrub,wcWetland]).mosaic().gte(1); 
// Reproject 10m short veg data to 30m: 
var shortVeg30 = wcShortVeg.reproject({crs:wcProj})
                          .reduceResolution({reducer: ee.Reducer.median()})
                          .reproject({crs:umdProj}).selfMask();
// EXPORT THIS FOR FASTER PROCESSING^

// Mosaic WC bare and moss classes to form bare ground class
var wcBareG = ee.ImageCollection([wcBare,wcMoss]).mosaic().gte(1); //mosaic WC bare and moss classes to form bare ground class
// Reproject 10m bare data to 30m: 
var wcBareG = wcBareG.reproject({crs:wcProj})
                    .reduceResolution({reducer: ee.Reducer.median()})
                    .reproject({crs:umdProj}).selfMask();
// EXPORT THIS FOR FASTER PROCESSING ^



///////////////////////////////////////////////////////
/// SUPPLEMENTARY DATA ////
///////////////////////////////////////////////////////

//// Global Mangrove Watch 2020--------------------------------------------------------------------------
var gmwMangroves = ee.FeatureCollection('projects/wri-datalab/SBTN/Mangrove_GMW_v3_2020');

// Convert vector to binary raster:
var mangroves_poly = gmwMangroves.map(function(feat) {
  return feat.set('gmw',1);
});
var mangroves = mangroves_poly.reduceToImage(['gmw'], ee.Reducer.first()).reproject({crs:umdProj});
// EXPORT THIS FOR FASTER PROCESSING ^


//// IIASA Mining Areas--------------------------------------------------------------------------
var IIASAmines = ee.FeatureCollection('projects/wri-datalab/SBTN/IIASA_mining_polygons');

// Convert vector to binary raster:
var minePoly = IIASAmines.map(function(feat) {
  return feat.set('mines',1);
});
var minesRaster = minePoly.reduceToImage(['mines'], ee.Reducer.first()).reproject({crs:umdProj});
// EXPORT THIS FOR FASTER PROCESSING ^

// Select only areas in mines thare are bare or have water. These will be labelled non natural  
var mines = minesRaster.where(wcBareG.eq(1).or(umdBare.eq(1)),2);
var mines = mines.where(mines.eq(1).and(umdWater20.eq(1)),2).eq(2);




//// WRI Peatland--------------------------------------------------------------------------
var wriPeat1 = ee.Image('projects/wri-datalab/SBTN/Peat_WRI/10N_10S_peat_mask_processed');
var wriPeat2 = ee.Image('projects/wri-datalab/SBTN/Peat_WRI/20-30N_20-30S_peat_mask_processed');
var wriPeat3 = ee.Image('projects/wri-datalab/SBTN/Peat_WRI/40-50N_40-50S_peat_mask_processed');
var wriPeat4 = ee.Image('projects/wri-datalab/SBTN/Peat_WRI/60-80N_60-80S_peat_mask_processed');
var wriPeat = ee.ImageCollection([wriPeat1,wriPeat2,wriPeat3,wriPeat4]).mosaic();


//// USGS Global Cropland Extent (2015, 30m)------------------------------------------------------
var af =   ee.Image('projects/wri-datalab/SBTN/GFSAD30/GFSAD30AFCE_2015').gt(1);
var au =   ee.Image('projects/wri-datalab/SBTN/GFSAD30/GFSAD30AUNZCNMOCE_2015').gt(1);
var euA =  ee.Image('projects/wri-datalab/SBTN/GFSAD30/GFSAD30EUCEARUMECE_2015_A').gt(1);
var euB =  ee.Image('projects/wri-datalab/SBTN/GFSAD30/GFSAD30EUCEARUMECE_2015_B').gt(1);
var naA =  ee.Image('projects/wri-datalab/SBTN/GFSAD30/GFSAD30NACE_2010_A').gt(1);
var naB =  ee.Image('projects/wri-datalab/SBTN/GFSAD30/GFSAD30NACE_2010_B').gt(1);
var saaf = ee.Image('projects/wri-datalab/SBTN/GFSAD30/GFSAD30SAAFGIRCE_2015').gt(1);
var sa =   ee.Image('projects/wri-datalab/SBTN/GFSAD30/GFSAD30SACE_2015').gt(1);
var sea =  ee.Image('projects/wri-datalab/SBTN/GFSAD30/GFSAD30SEACE_2015').gt(1);

var gfsad = ee.ImageCollection([af.selfMask(),au.selfMask(),euA.selfMask(),euB.selfMask(),
naA.selfMask(),naB.selfMask(),saaf.selfMask(),sa.selfMask(),sea.selfMask()]).mosaic();

var usgsCrop = gfsad.reproject({crs:umdProj});
// EXPORT THIS FOR FASTER PROCESSING ^



///////////////////////////////////////////////////////
/// LOCAL DATA ////
///////////////////////////////////////////////////////

//// MAPBIOMAS--------------------------------------------------------------------------
/// PROCESSING OF MAPBIOMAS WERE DONE IN A DIFFERENT SCRIPT: see naturalLands_0.3_preProcessing_Mapbiomas_remapped
// Brazil collection 7.0 (2020)
// Amazon collection 4.0 (2020)
// Chaco collection 3.0 (2020)
// Atlantic forest collection 2.0 (2020)
// Pampa collection 2.0 (2020)
// Indonesia collection 1.0 (2019)

// Mapbiomas data were re-projected, harmonized to natural lands map classes, mosaicked, and then exported. 
// South America
var mapbiomas_sa = ee.Image('projects/wri-datalab/SBTN/map/mapbiomas_southAmerica_remapped_20230412').rename(['constant']).selfMask();  

// Indonesia
var mapbiomas_idn = ee.Image('projects/wri-datalab/SBTN/map/mapbiomas_Indonesia_remapped_20230412').rename(['constant']).selfMask(); 


//// South Africa National Land Cover--------------------------------------------------------------------------
var southAfrica = ee.Image('projects/wri-datalab/SBTN/Local_data/SouthAfrica_NLC_2020').rename(['constant']);
// Remap to natural lands classes:
var sa_remap = southAfrica.remap([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
                        [2, 2, 2, 2, 14,14,14,3, 3, 3,  3,  3,  3,   4,  4,  4,  4,  4, 16, 16, 16, 10, 10, 5,  6,   6,  6,  6,  6,  6,  6, 14, 12, 12, 12, 12, 12, 12, 12, 12, 12, 2,  3,  3,   6,  3, 14, 15, 15, 13, 14, 15, 15, 13, 13, 13, 14, 15, 15, 13, 14, 15, 15, 13, 13, 13, 13, 13, 13, 13, 13, 13, 10]);

// Reproject 20m reclassified South Africa Land Cover data to 30m:
var sa_nlc = sa_remap.reduceResolution({reducer: ee.Reducer.mode()})
                           .reproject({crs:umdProj}).selfMask();
// EXPORT THIS FOR FASTER PROCESSING ^


//// New Zealand LUCAS Land Cover--------------------------------------------------------------------------
// NZ data were converted from vector to raster in another script: https://code.earthengine.google.com/e4bcd9a2c826a04abb1d84e12c46596a
var nzReprojected = ee.Image('projects/wri-datalab/SBTN/map/newZealand_LC_remapped');
var nzRemap = nzReprojected.remap([1,	2,	3,	10,	11,	12,	13,		20,	21,	22,	23,	24,	30,	31,		32,	33,	34,	35,		36,	37,	38,	40,	41,	50,	51,	52,	60,	61,	70,	80,],
                                  [2,	2,	2,	14,	14,	14,	14,		2,	14,	14,	14,	2,	3,	15,		15,	15,	15,	3,		3,	3,	3,	12,	12,	4,	4,	16,	10,	17,	13,	6,]);
var nzRemap = nzRemap.rename(['constant']);


//// ETH/EcoVision Cocoa Map--------------------------------------------------------------------------
var cocoa_map_th = ee.Image('projects/ee-nk-cocoa/assets/cocoa_map_threshold_065');

// Reproject 10m binary cocoa data to 30m
var ethCocoa = cocoa_map_th.reduceResolution({reducer: ee.Reducer.mode()})
                           .reproject({crs:umdProj}).selfMask();
// EXPORT THIS FOR FASTER PROCESSING ^


//// CORINE Land Cover--------------------------------------------------------------------------
var corine = ee.Image('COPERNICUS/CORINE/V20/100m/2018');
var corine_natGrass_orig = corine.remap([321,322,323],[1,1,1]).rename(['constant']);

// Reproject 100m data to 30m
var corine_natGrass = corine_natGrass_orig.reduceResolution({reducer: ee.Reducer.mode()})
                           .reproject({crs:umdProj}).selfMask();
// EXPORT THIS FOR FASTER PROCESSING ^



///////////////////////////////////////////////////////
/// MAKING FORESTS ////
///////////////////////////////////////////////////////

// NATURAL FOREST LAYER
// The natural forest layer is made by removing the SDPT v2 from the UMD 2020 forest extent. 
// SDPT v2 uses Lesiv et al for European countries and for any country without coverage from other data sources in the SDPT, 
//    and with plantation or planted forest > 0 according to the 2020 FAO FRA
// Before removing SDPT and Lesiv from the forests layer, forests within Intact Forest Landscapes 2020 and Sabatini et al. 
//    European primary forests are masked, so that these areas of potentially primary/old growth forests are not removed. 
// This is an added precaution due to the mix of resolutions of input data in SDPT and potential misclassifications
//    in the Lesiv data

//// LOAD DATA--------------------------------------------------------------------------

//// Load Spatial Database of Planted Trees v2 data--------------------------------------------------------------------------
var sdptv2 = ee.Image('projects/wri-datalab/SBTN/map/SDPT_v2_20230417_binary');


//// Sabatini et al. 2021 EU Primary Forests--------------------------------------------------------------------------
// Convert vector to binary raster:
var eu_primary = ee.FeatureCollection('projects/wri-datalab/SBTN/EU_PrimaryForests_Polygons_Sabatini_2021');
var eu_primary = eu_primary.map(function(feat) {
  return feat.set('primary', 1);
});
var sabatini = eu_primary.reduceToImage(['primary'], ee.Reducer.first()).unmask().reproject(umdProj);
// EXPORT THIS FOR FASTER PROCESSING ^


//// Intact Forest Landscapes 2020--------------------------------------------------------------------------
var ifl_2020 = ee.Image('users/potapovpeter/IFL_2020');

// Set SDPT v2 to zero where overlapping with Sabatini primary forest areas and IFL 2020
// This masks out these areas from the SDPT v2 data, so that when we remove SDPT v2 from the forests layer, we are not removing areas that overlap with Sabatini primary or IFL 2020
// This helps to ensure we are not removing tree cover that might be primary forest
var sdpt_mask = sdptv2.where(sabatini.eq(1), 0);
var sdpt_mask = sdpt_mask.where(ifl_2020.eq(1), 0);


//// PREPARE FOREST LAYER--------------------------------------------------------------------------------
// Remove SDPT from UMD Forest extent:
var forest_natural = umdForest.where(sdpt_mask.eq(1), 0);

// All forest that was removed is classified as non-natural:
var forest_notNatural = umdForest.selfMask().updateMask(forest_natural.not());



///////////////////////////////////////////////////////
/// MAKING SHORT VEGETATION ////
///////////////////////////////////////////////////////

// NATURAL SHORT VEGETATION CLASS
// At the time of publication there were no global datasets differentiating natural
// from non-natural grasslands that aligns with the AFi definition of natural grasslands, 
// therefore we used the Gridded Livestock of the World 4.0 data to create a threshold of 
// livestock density as a proxy for intensive pasture. See technical note for explanation 
// of how thresholds were decided.

//// Gridded Livestock of the World 4.0--------------------------------------------------------------------------
var glwPixelArea = ee.Image('projects/wri-datalab/SBTN/GLW4/PixelArea_km');
// convert count to density per unit area:
var buffalo = ee.Image('projects/wri-datalab/SBTN/GLW4/buffalo_2015_Da').divide(glwPixelArea);
var cattle  = ee.Image('projects/wri-datalab/SBTN/GLW4/cattle_2015_Da').divide(glwPixelArea);
var goats   = ee.Image('projects/wri-datalab/SBTN/GLW4/goat_2015_Da').divide(glwPixelArea);
var sheep   = ee.Image('projects/wri-datalab/SBTN/GLW4/sheep_2015_Da').divide(glwPixelArea);

// Apply high density thresholds:
var highDensityLivestock = ee.ImageCollection([cattle.updateMask(cattle.gt(55.33)),goats.updateMask(goats.gt(119.50)),
                                        sheep.updateMask(sheep.gt(135)),buffalo.updateMask(buffalo.gt(60))]).mosaic();

var glwProj = glwPixelArea.projection();

// Reproject 10km GLW data to 30m: 
var livestock30 = highDensityLivestock.reproject({crs:glwProj})
                                      .reduceResolution({reducer: ee.Reducer.median()})
                                      .reproject({crs:umdProj}).selfMask();
// EXPORT THIS FOR FASTER PROCESSING ^


//// PREPARE SHORT VEG LAYER--------------------------------------------------------------------------------

// Remove high density livestock from short vegetation layer and classify remaining short veg as natural: 
var shortVeg_natural = shortVeg30.unmask().gt(0).updateMask(livestock30.gt(0).unmask().not());

// Label masked short vegetation as not-natural:
var shortVeg_notNatural = shortVeg30.selfMask().updateMask(shortVeg_natural.unmask().not());



///////////////////////////////////////////////////////
/// MAKING INTERMEDIATE NATURAL LANDS ////
///////////////////////////////////////////////////////
// This step combines all classes to create an intermediate version of the full natural lands map. 
// A minimum mapping unit of 0.5 ha is then applied to the resulting natural forests and short vegetation classes. 

var blank = ee.Image(1);

//// NATURAL CLASSES------------------------------------
var tempNatural = blank.where(forest_natural.eq(1),2);                                 //forests = 2
var tempNatural = tempNatural.where(tempNatural.eq(1).and(shortVeg_natural.eq(1)), 3); //short veg = 3
var tempNatural = tempNatural.where(tempNatural.eq(1).and(water_natural.eq(1)), 4);    //water = 4 
var tempNatural = tempNatural.where(mangroves.eq(1), 5);                               //mangroves = 5 
var tempNatural = tempNatural.where(tempNatural.eq(1).and(wcBareG.eq(1)), 6);          //bare = 6
var tempNatural = tempNatural.where(tempNatural.eq(1).and(umdBare.eq(1)), 6);          //bare = 6
var tempNatural = tempNatural.where(tempNatural.eq(1).and(umdSnow.eq(1)), 7);          //snow = 7

//// NON-NATURAL CLASSES---------------------------------
var tempAll = tempNatural.where(tempNatural.eq(1).and(forest_notNatural.eq(1)), 14);  //non natural tree cover = 14
var tempAll = tempAll.where(sdpt_mask.eq(1).and(tempAll.eq(3)), 15);                  //non natural short veg = 15
var tempAll = tempAll.where(tempAll.eq(1).and(shortVeg_notNatural.eq(1)), 15);        //non natural short veg = 15
var tempAll = tempAll.where(umdCrop.eq(1), 12);                                       //cropland = 12
var tempAll = tempAll.where(usgsCrop.eq(1), 12);                                      //cropland = 12
var tempAll = tempAll.where(umdBuilt.gte(1), 13);                                     //built-up = 13
var tempAll = tempAll.where(mines.eq(1), 13);                                         //built-up = 13


var intermediateMap = tempAll.updateMask(tempAll.gt(1));
// Map.addLayer(intermediateMap, {min:2, max:16, palette: ["347834","B9B91E","6BAED6","06A285","FEFECC","ACD1E8",'ffffff','ffffff','ffffff','ffffff',"ded485","bd6c5b","bdbdbd","969696","737373",]}, 'all land covers',0)



///////////////////////////////////////////////////////////////
///  APPLYING MINIMUM MAPPING UNIT TO SHORT VEG AND FORESTS ///
///////////////////////////////////////////////////////////////

var natForests = intermediateMap.eq(2);
var natShortveg = intermediateMap.eq(3);

//// SHORT VEG MMU-------------------------------
// Count connected pixels:
var pixel_countV = natShortveg.connectedPixelCount({eightConnected:true}).reproject({crs:umdProj});
// Calculate pixel area: 
var pixelAreaV = ee.Image.pixelArea().reproject({crs:umdProj});
// Mutliply pixel count x area: 
var objectAreaV = pixel_countV.multiply(pixelAreaV);
// Set threshold (m^2) and apply:
var mmu = 5000;
var mmu_maskV = objectAreaV.gte(mmu);

// Create natural short veg with mmu applied:
var shortVeg_natmmu = natShortveg.updateMask(mmu_maskV).rename(['b1']);

// Create updated non-natural short veg:
var shortVeg_notNatmmu = shortVeg30.selfMask().updateMask(shortVeg_natmmu.eq(1).unmask().not()).rename(['b1']);  

// Combine into one image for exporting 
var allShortVeg_mmu = ee.ImageCollection([shortVeg_notNatmmu.selfMask().multiply(2),shortVeg_natmmu.selfMask()]).mosaic();
// EXPORT THIS FOR FASTER PROCESSING ^


//// FOREST MMU-----------------------------------
// Count connected pixels: 
var pixel_countF = natForests.connectedPixelCount({eightConnected:true}).reproject({crs:umdProj});
// Calculate pixel area:
var pixelAreaF = ee.Image.pixelArea().reproject({crs:umdProj});
// Mutliply pixel count x area: 
var objectAreaF = pixel_countF.multiply(pixelAreaF);
// Set threshold (m^2) and apply:
var mmu = 5000;
var mmu_maskF = objectAreaF.gte(mmu);

// Create natural forest with mmu applied:
var forest_natmmu = natForests.updateMask(mmu_maskF).rename(['b1']);

// Create updated non-natural tree cover:
var forest_notNatmmu = umdForest.selfMask().updateMask(forest_natmmu.eq(1).unmask().not()).rename(['b1']);

// Combine into one image for exporting:
var allForest_mmu = ee.ImageCollection([forest_notNatmmu.selfMask().multiply(2),forest_natmmu.selfMask()]).mosaic(); 
// EXPORT THIS FOR FASTER PROCESSING ^


///////////////////////////////////////////////////////
/// MAKING FULL NATURAL LANDS MAP WITH GLOBAL DATA////
///////////////////////////////////////////////////////
// This step creates the full natural lands map with global data and MMU applied to natural forest and short veg classes. 

var blank = ee.Image(1); 

//// NATURAL CLASSES---------------------------------
var natural = blank.where(forest_natmmu.eq(1),2);                           //forests = 2
var natural = natural.where(natural.eq(1).and(shortVeg_natmmu.eq(1)), 3);   //short veg = 3
var natural = natural.where(natural.eq(1).and(water_natural.eq(1)), 4);     //water = 4 
var natural = natural.where(mangroves.eq(1), 5);                            //mangroves = 5 
var natural = natural.where(natural.eq(1).and(wcBareG.eq(1)), 6);           //bare = 6
var natural = natural.where(natural.eq(1).and(umdBare.eq(1)), 6);           //bare = 6
var natural = natural.where(natural.eq(1).and(umdSnow.eq(1)), 7);           //snow = 7

//// NON-NATURAL CLASSES-------------------------------
var all = natural.where(natural.eq(1).and(forest_notNatmmu.eq(1)), 14);     //non natural tree cover = 14
var all = all.where(sdpt_mask.gte(1).and(all.eq(3)), 15);                   //non natural short veg = 15
var all = all.where(all.eq(1).and(shortVeg_notNatmmu.eq(1)), 15);           //non natural short veg = 15
var all = all.where(all.eq(1).and(umdVegFraction.eq(1)), 3);                //other natural short veg = 3 (any remaining short veg assumed to be natural)
var all = all.where(umdCrop.eq(1), 12);                                     //cropland = 12
var all = all.where(usgsCrop.eq(1), 12);                                    //cropland = 12
var all = all.where(umdBuilt.gte(1), 13);                                   //built-up = 13
var all = all.where(mines.eq(1), 13);                                       //built-up = 13

// Overlay wetlands
var all = all.where(all.eq(2).and(umdWetTrees.eq(1)), 8);                   //natural wet trees = 8
var all = all.where(all.eq(3).and(umdWetVeg.eq(1)), 10);                    //natural wet short veg = 10
var all = all.where(all.eq(14).and(umdWetTrees.eq(1)), 17);                 //non natural wet trees = 17
var all = all.where(all.eq(15).and(umdWetVeg.eq(1)), 19);                   //non natural wet short veg = 19

var globalMap = all.updateMask(all.gt(1)).toUint8();



////////////////////////////////////////////////////////
// MOSAIC LOCAL DATA TOGETHER ///////
///////////////////////////////////////////////////////

//// Harmonize ETH cocoa-----------------------------
var harmonizedCocoa = ethCocoa.where(ethCocoa.eq(1), 14); // Remap all cocoa to non-natural tree cover
var harmonizedCocoa = harmonizedCocoa.where(globalMap.eq(12), 12); // Remap to cropland where applicable, since crop has higher priority when combining classes
var harmonizedCocoa = harmonizedCocoa.where(globalMap.eq(13), 13); // Remap to built-up where applicable, since built has higher priority when combining classes

//// Add Snow into New Zealand LC-------------------
var nz_lc = nzRemap.where(nzRemap.eq(6).and(globalMap.eq(7)), 7);  // The bare class contains snow/ice, so re-map that to snow/ice

//// Select only CORINE Natural Grasslands where we call it short vegetation (3=dry, 10=wet)
var corine_natShortVeg = corine_natGrass.where(corine_natGrass.eq(1).and(globalMap.eq(15)),3);
var corine_natShortVeg = corine_natShortVeg.where(corine_natGrass.eq(1).and(globalMap.eq(19)),10);
var corine_natShortVeg = corine_natShortVeg.updateMask(corine_natShortVeg.gt(1));

//// Mosaic all local data together------------------
var local = ee.ImageCollection([mapbiomas_sa, mapbiomas_idn, nz_lc, sa_nlc, corine_natShortVeg, harmonizedCocoa]).mosaic(); //// Add in other local data here



////////////////////////////////////////////////////////////////
////CREATE FINAL MAP ////////
//////////////////////////////////////////////////////////////

//// Mosaic local data with global data, giving local data priority------------------------------
var lands = ee.ImageCollection([globalMap, local]).mosaic();

//// Overlay peatlands-----------------------------------------
var lands = lands.where((lands.eq(2).or(lands.eq(8))).and(wriPeat.eq(1)), 9); // Natural peat forests = 9
var lands = lands.where((lands.eq(3).or(lands.eq(10))).and(wriPeat.eq(1)), 11); // Natural peat short veg = 11

var lands = lands.where((lands.eq(14).or(lands.eq(17))).and(wriPeat.eq(1)), 18); // Non-natural peat trees = 18
var lands = lands.where((lands.eq(15).or(lands.eq(19))).and(wriPeat.eq(1)), 20); // Non-natural peat veg = 20

//// Final map---------------------------------------
var naturalLands = lands.updateMask(lands.gt(1)).toUint8().updateMask(landmask);
Map.addLayer(naturalLands, {min:2, max:20, palette: ["246e24","B9B91E","6BAED6","06A285","fef3cc","ACD1E8","589558","093d09","dbdb7b","99991a","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3",]}, 'Natural Ecosystem Map',1);

// Natural classes only
var naturalClasses = naturalLands.updateMask(naturalLands.lt(12));
Map.addLayer(naturalClasses,{min:2, max: 11, palette: ["246e24","B9B91E","6BAED6","06A285","fef3cc","ACD1E8","589558","093d09","dbdb7b","99991a"]},'Natural Classes Only',0);

// Non-natural classes only
var notNaturalClasses = naturalLands.updateMask(naturalLands.gt(11));
Map.addLayer(notNaturalClasses,{min:12, max:20, palette:["ded485",	"bd6c5b",	"bdbdbd",	"969696",	"737373",	"525252",	"bdbdbd",	"252525",	"969696",]},'Not-Natural Classes Only (Testing)',0);
Map.addLayer(notNaturalClasses,{min:12, max:20, palette:["D3D3D3"]},'Not-Natural Classes Only',0);

// Binary map
var binary = ee.ImageCollection([notNaturalClasses.gt(1).multiply(2),naturalClasses.gt(1)]).mosaic();
Map.addLayer(binary, {min:1,max:2,palette:['a8ddb5','969696']},'binary',0,0.7);



///////////////////////////////////////////////////////
/// EXPORT THE IMAGES
///////////////////////////////////////////////////////
var world = ee.Geometry.BBox(-179.9, -60, 180, 75)
var cords = umdProj.getInfo();


var exportImage = function(image,region,name){
  Export.image.toAsset({
    image:image, 
    description:'SBTN_'+name, 
    assetId:'SBTN/'+name, 
    pyramidingPolicy:'sample', 
    region:region, 
    crs:cords['crs'],
    crsTransform: cords['transform'],
    maxPixels:1e13
  })
}

// Example:
// exportImage(corine_natGrass,geometry,'corine_shortVeg_reprojected')





///////////////////////////////////////////////////////
/// LEGEND
///////////////////////////////////////////////////////
var palette = [
 "246e24",  // forest
 "589558",  // wet forest
 "093d09",  // peat forest
 "FFFFFF",  // SPACE
 "B9B91E",  // short veg
 "dbdb7b",  // wet short veg
 "99991a",  // peat short veg
 "FFFFFF",  // SPACE
 "6BAED6",  // water
 "06A285",  // mangroves
 "fef3cc",  // bare
 "ACD1E8",  // snow
 "D3D3D3",  // Mot Natural
 ]
 
var legend_colors = palette;
var legend_keys = ['Forests (2)', 'Wet Forests (8)', 'Peat Forests (9)', ' ', 'Short Vegetation (2)', 'Wet Short Vegetation (10)', 'Peat Short Vegetation (11)','', 'Water (4)', 'Mangroves (5)', 'Bare Ground (6)', 'Snow (7)', 'Not Natural (12-20)']

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
var palette2 =legend_colors;

// Name of the legend
var names = legend_keys;
// Add color and and names (i< should be less than number of classes)
for (var i = 0; i < 13; i++) {
  legend.add(makeRow(palette2[i], names[i]));
  }  

// add legend to map  
Map.add(legend); 

