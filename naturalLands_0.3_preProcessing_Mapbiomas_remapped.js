/*
NATURAL LANDS MAP FOR SBTN NO CONVERSION TARGET SETTING
Version 0.3 (beta)
WRI, April 2023
Full Technical Note: https://sciencebasedtargetsnetwork.org/wp-content/uploads/2023/05/Technical-Guidance-2023-Step3-Land-v0.3-Natural-Lands-Map.pdf

MAPBIOMAS PRE-PROCESSING
This script harmonizes MapBiomas data to Natural Lands map classes, mosaics, and exports the data.
The harmonized layer is then incorporated into the Natural Lands map. 
See script titled naturalLands_0.3 for full Natural Lands map compilation process
*/

var geometry = 
    ee.Geometry.Polygon(
        [[[-89.61894531250002, 8.868461856177323],
          [-89.61894531250002, -40.22527744525331],
          [-22.997851562500014, -40.22527744525331],
          [-22.997851562500014, 8.868461856177323]]], null, false),
    olson_buffer = 
    ee.Geometry.Polygon(
        [[[-62.241691195386984, -18.508136595906056],
          [-61.406730257886984, -25.51010262407629],
          [-66.37255057038698, -33.01546279036723],
          [-65.58153494538698, -34.44078519901364],
          [-57.583488070386984, -30.057094754998722],
          [-52.529777132886984, -25.906055707558625],
          [-53.496574007886984, -20.372828864715586],
          [-57.495597445386984, -17.08554026338886],
          [-60.221730415916504, -16.7200757964767]]]);


///////////////////////////////////////////////////////
/// LOAD BASE LAND COVER DATA ////
///////////////////////////////////////////////////////

//// UMD Land Cover--------------------------------------------------------------------------
// We overlaid UMD land cover data with the Mapbiomas data to assign more detailed classes where needed for harmonization with the Natural Lands Map.

// We used the individual land cover classes when available.
var umdCrop = ee.Image("projects/glad/GLCLU2020/Cropland_2019").selfMask();
var umdBuilt = ee.Image("projects/glad/GLCLU2020/Builtup_type").selfMask(); // 1=stable(2000-2020) 2=gain. 1&2 = 2020 extent

// We used the composite land cover map for classes that don't have individual assets (wetland classes)
var umdLC = ee.Image('projects/glad/GLCLU2020/LCLUC_2020');
// re-map the 255 values into 10 land cover classes:
// 0=bare, 1=shortVeg, 2=forest, 3=tallForest, 4=wetShortVeg, 5=wetForest, 6=water, 7=ice, 8=crop, 9=built
var umd2020 = umdLC.remap([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,	26,	27,	28,	29,	30,	31,	32,	33,	34,	35,	36,	37,	38,	39,	40,	41,	42,	43,	44,	45,	46,	47,	48,100,	101,	102,	103,	104,	105,	106,	107,	108,	109,	110,	111,	112,	113,	114,	115,	116,	117,	118,	119,	120,	121,	122,	123,	124,	125,	126,	127,	128,	129,	130,	131,	132,	133,	134,	135,	136,	137,	138,	139,	140,	141,	142,	143,	144,	145,	146,	147,	148,200,	201,	202,	203,	204,	205,	206,	207,241,  244,  250],
                          [0,1,1,1,1,1,1,1,1,1,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 , 2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	2,	3,	3,	3,	3,	3,	3,	3,4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	4,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,	5,6,	6,	6,	6,	6,	6,	6,	6,7,8,9])
var umd_remapVis = {min:0,max:9,palette:["FEFECC","B9B91E","347834","0D570D","88CAAD","589558","6baed6","acd1e8","fff183","e8765d"]}
Map.addLayer(umd2020,umd_remapVis,'UMD LC 2020',0);

var umdWetVeg = umd2020.eq(4);

var umdProj = umdLC.projection();

///////////////////////////////////////////////////////
/// LOAD MAPBIOMAS DATA ////
///////////////////////////////////////////////////////

//Load 2020 land cover map for each collection. 
//Reproject to UMD land cover projection

// Brazil collection 7.0
var brazil = ee.Image('projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2').select('classification_2020').reproject({crs:umdProj});

// Amazon collection 4.0
var amazon = ee.Image('projects/mapbiomas-raisg/public/collection4/mapbiomas_raisg_panamazonia_collection4_integration_v1').select('classification_2020').reproject({crs:umdProj});

// Chaco collection 3.0
var chaco = ee.Image('projects/mapbiomas-chaco/public/collection3/mapbiomas_chaco_collection3_integration_v2').select('classification_2020').reproject({crs:umdProj});

// Atlantic forest 2.0
var atlantic = ee.Image('projects/mapbiomas_af_trinacional/public/collection2/mapbiomas_atlantic_forest_collection20_integration_v1').select('classification_2020').reproject({crs:umdProj});

// Pampa 2.0
var pampa = ee.Image('projects/MapBiomas_Pampa/public/collection2/mapbiomas_pampa_collection2_integration_v1').select('classification_2020').reproject({crs:umdProj});

// Indonesia 1.0
var indo = ee.Image('projects/mapbiomas-indonesia/public/collection1/mapbiomas_indonesia_collection1_integration_v1').select('classification_2019').reproject({crs:umdProj});

///////////////////////////////////////////////////////
/// HARMONIZE MAPBIOMAS TO NATURAL LANDS MAP CLASSES////
///////////////////////////////////////////////////////

//Load in the Chaco ecoregion from WWF Terrestrial Ecoregions of the World, v2.0
//Downloaded from https://www.worldwildlife.org/publications/terrestrial-ecoregions-of-the-world
//Olson, D.M., E. Dinerstein, E.D. Wikramanayake, N.D. Burgess, G.V.N. Powell, E.C. Underwood, J.A. D'Amico, I. Itoua, H.E. Strand, J.C. Morrison, C.J. Loucks, T.F. Allnutt, T.H. Ricketts, Y. Kura, J.F. Lamoreux, W.W. Wettengel, P. Hedao, and K.R. Kassem. Terrestrial Ecoregions of the World: A New Map of Life on Earth (PDF, 1.1M) BioScience 51:933-938.

//Chaco ecoregion (including dry and humid Chaco) was exported as separate shapefile and uploaded to GEE
//Mapbiomas Chaco collection will be clipped to Chaco ecoregion
var olson_chaco = ee.FeatureCollection('projects/wri-datalab/SBTN/olson_chaco_ecoregion');

//Create new geometry to buffer Chaco ecoregion and convert to Feature Collection
//This avoids creating gaps between Mapbiomas Chaco and other Mapbiomas layers when mosaicking
var olson_buffer = ee.FeatureCollection(olson_buffer);
var olson_buffer= olson_buffer.map(function(feat) {
  return feat.set('chaco',1);
 });

//Merge the two feature collections
var olson_extended = olson_chaco.merge(olson_buffer);

//Convert vector to binary raster
var olson_extended_mask = olson_extended.reduceToImage(['chaco'], ee.Reducer.first()).unmask().reproject({crs:umdProj});

////MAPBIOMAS BRAZIL REMAP 
//------------------
//Original classes:
//3: Forest formation
//4: Savanna Formation
//49: Sandy coastal plain vegetation
//5: Mangrove
//11: Wetland
//12: Grassland
//32: Hypersaline Tidal Flat
//29: Rocky outcrop
//50: Herbaceous Sandbank Vegetation
//13: Other non-forest formation
//15: Pasture
//39: Soybean
//20: Sugar cane
//40: Rice
//62: Cotton
//41: Other temporary crops
//46: Coffee
//47: Citrus
//48: Other perennial crops
//21: Agricultural mosaic
//9: Forest plantation
//23: Beach, dune, sand 
//24: Urban area
//30: Mining
//25: Other non-vegetated area
//33: River, lake, ocean
//31: Aquaculture

//Remapped classes:
//2: Natural forest
//2: Natural forest
//2: Natural forest
//5: Mangroves
//10: Wet natural short vegetation
//3: Natural short vegetation
//10: Wet natural short vegetation
//6: Bare
//10: Wet natural short vegetation
//3: Natural short vegetation
//15: Non-natural short vegetation
//12: Cropland
//12: Cropland
//12: Cropland
//12: Cropland
//12: Cropland
//14: Non-natural tree cover
//14: Non-natural tree cover
//14: Non-natural tree cover
//12: Cropland
//14: Non-natural tree cover
//6: Bare
//13: Built-up
//13: Built-up
//26: Placeholder (if UMD built, then 13 [built-up]; if UMD crop, then 12 [cropland]; all else 6 [natural bare]) 
//4: Natural water
//16: Non-natural water

//Remap mapbiomas classes to natural lands classes
var brazil_remap = brazil.remap([3,4,49,5,11,12,32,29,50,13,15,39,20,40,62,41,46,47,48,21, 9,23,24,30,25,33,31],
                                [2,2, 2,5,10, 3,10, 6,10, 3,15,12,12,12,12,12,14,14,14,12,14, 6,13,13,26, 4,16]).toUint8();
                                
var brazil_remap = brazil_remap.where(brazil_remap.eq(26).and(umdBuilt.gte(1)), 13); //Remap placeholder to built-up where UMD is built
var brazil_remap = brazil_remap.where(brazil_remap.eq(26).and(umdCrop.eq(1)), 12); //Remap placeholder to cropland where UMD is crop
var brazil_remap = brazil_remap.where(brazil_remap.eq(26), 6).toUint8(); //Remap placeholder to natural bare for all other areas                     

////MAPBIOMAS AMAZON REMAP 
//-------------------------
//Original classes:
//3: Forest formation
//4: Savanna formation
//5: Mangrove
//6: Flooded forest
//11: Wetland
//12: Grassland
//13: Other non-forest natural formation
//29: Rocky outcrop
//15: Pasture
//18: Agriculture
//35: Oil Palm
//9: Silviculture
//21: Agricultural mosaic
//24: Urban infrastructure
//30: Mining
//25: Other non-vegetated area
//33: River, lake, ocean
//34: Glacier
//27: Not observed

//Remapped classes:
//2: Natural forest
//2: Natural forest
//5: Mangroves
//8: Wet natural forest
//10: Wet natural short vegetation
//3: Natural short vegetation
//3: Natural short vegetation
//6: Bare
//15: Non-natural short vegetation
//12: Cropland
//14: Non-natural tree cover
//14: Non-natural tree cover
//12: Cropland
//13: Built-up
//13: Built-up
//26: Placeholder (if UMD built, then 13 [built-up]; if UMD crop, then 12 [cropland]; all else 6 [natural bare])
//4: Natural Water
//7: Snow
//0: No data

//Remap mapbiomas classes to natural lands classes
var amazon_remap = amazon.remap([3,4,5,6,11,12,13,29,15,18,35,9, 21,24,30,25,33,34,27],
                                [2,2,5,8,10, 3, 3, 6,15,12,14,14,12,13,13,26, 4, 7, 0]);

var amazon_remap = amazon_remap.where(amazon_remap.eq(26).and(umdBuilt.gte(1)), 13); //Remap placeholder to built-up where UMD is built
var amazon_remap = amazon_remap.where(amazon_remap.eq(26).and(umdCrop.eq(1)), 12); //Remap placeholder to cropland where UMD is crop
var amazon_remap = amazon_remap.where(amazon_remap.eq(26), 6).toUint8(); //Remap placeholder to natural bare for all other areas

///MAPBIOMAS CHACO REMAP
//-----------------------------------
//Original classes:
// 3: Natural forest
// 4: Natural open woodland forest (open canopy <20% tree cover)
// 6: Wet Forest
// 45: Dispersed trees (natural)
// 11: Wetland
// 42: Grassland with open canopy (1-20%)
// 43: Grassland with closed canopy
// 44: Grassland with dispersed trees
// 15: Pasture
// 57: Annual crop with one type of crop
// 58: Annual crop with more than one type of crop
// 36: Perennial crop
// 9: Forest plantation
// 22: Non-vegetated
// 26: Water
// 27: Not observed

//Remapped classes:
// 2: Natural forest
// 2: Natural forest
// 8: Wet natural forest
// 2: Natural forest 
// 10: Wet natural short vegetation
// 3: Natural short vegetation 
// 3: Natural short vegetation 
// 3: Natural short vegetation 
// 15: Non-natural short vegetation 
// 12: Cropland
// 12: Cropland
// 14: Non-natural tree cover
// 14: Non-natural tree cover
// 6: Natural Bare (unless UMD built, then 13, unless UMD crop, then 12) 
// 4: Natural water 
// 0: No data

//Remap mapbiomas classes to natural lands classes
var chaco_remap = chaco.remap([3,4,6,45,11,42,43,44,15,57,58,36, 9,22,26,27],
                              [2,2,8, 2,10, 3, 3, 3,15,12,12,14,14, 6, 4, 0]);

var chaco_remap = chaco_remap.where(chaco_remap.eq(6).and(umdBuilt.gte(1)), 13); //Remap natural bare to built-up where UMD is built
var chaco_remap = chaco_remap.where(chaco_remap.eq(6).and(umdCrop.eq(1)), 12).toUint8(); //Remap natural bare to cropland where UMD is crop

//Apply Chaco ecoregion mask
var chaco_remap_clipped_ext = chaco_remap.updateMask(olson_extended_mask);

///MAPBIOMAS PAMPA REMAP
//------------------------------
//Original classes:
// 3: Natural forest
// 4: Natural open forest (open canopy 20-65% tree cover)
// 11: Wetland
// 12: Grassland
// 15: Pasture (not in data)
// 18: Agriculture (not in data)
// 9: Forest plantation
// 21: Other ag (mosaic)
// 22: Non-vegetated
// 33: River, lake, ocean
// 27: Not observed

//Remapped classes:
// 2: Natural forest
// 2: Natural forest
// 10: Wet natural short vegetation
// 3: Natural short vegetation
// 15: Non-natural short vegetation 
// 12: Cropland
// 14: Non-natural tree cover
// 12: Cropland
// 6: Natural Bare (unless UMD Built, then 13; unless UMD crop, than 12) 
// 4: Natural water
// 0: No data

//Remap mapbiomas classes to natural lands classes
var pampa_remap = pampa.remap([3,4,11,12,15,18, 9,21,22,33,27],
                              [2,2,10, 3,15,12,14,12, 6, 4, 0]);

var pampa_remap = pampa_remap.where(pampa_remap.eq(6).and(umdCrop.eq(1)), 12); //Remap natural bare to cropland where UMD is crop
var pampa_remap = pampa_remap.where(pampa_remap.eq(6).and(umdBuilt.gte(1)), 13).toUint8(); //Remap natural bare to built-up where UMD is built

////MAPBIOMAS ATLANTIC FOREST REMAP
//-------------------------
//Original classes:
//3: Forest formation
//4: Savanna formation
//49: Wooded sandbank vegetation
//5: Mangroves
//11: Wetland
//12: Grassland
//32: Hypersaline tidal flat
//50: Herbaceous sandbank vegetation
//13: Other non-forest formations
//29: Rocky outcrop
//15: Pasture
//19: Temporary crop
//21: Agricultural mosaic
//36: Perennial crop
//9: Forest plantation
//22: Non-vegetated
//33: River, lake, ocean

//Remapped classes:
//2: Natural forest
//2: Natural forest
//2: Natural forest
//5: Mangroves
//10: Wet natural short vegetation
//3: Natural short vegetation
//10: Wet natural short vegetation
//10: Wet natural short vegetation
//3: Natural short vegetation
//6: Bare
//15: Non-natural short vegetation
//12: Cropland
//12: Cropland
//14: Non-natural tree cover
//14: Non-natural tree cover
//26: Placeholder (if UMD built, then 13 [built-up]; if UMD crop, then 12 [cropland]; all else 6 [natural bare])
//4: Natural water

//Remap mapbiomas classes to natural lands classes
var atlantic_remap = atlantic.remap([3,4,49,5,11,12,32,50,13,29,15,19,21,36, 9,22,33],
                                    [2,2, 2,5,10, 3,10,10, 3, 6,15,12,12,14,14,26, 4]);

var atlantic_remap = atlantic_remap.where(atlantic_remap.eq(26).and(umdBuilt.gte(1)), 13); //Remap placeholder to built-up where UMD is built
var atlantic_remap = atlantic_remap.where(atlantic_remap.eq(26).and(umdCrop.eq(1)), 12); //Remap placeholder to cropland where UMD is crop
var atlantic_remap = atlantic_remap.where(atlantic_remap.eq(26), 6).toUint8(); //Remap placeholder to natural bare for all other areas

///MAPBIOMAS INDONESIA REMAP
//-------------------
//Original classes:
//3: Natural forest
//5: Natural Mangrove
//13: Natural non-forest formation
//35: Oil Palm
//21: Other ag
//9: Forest plantation
//30: Mining
//25: Non-vegetated
//33: River, lake, ocean
//31: Aquaculture

//Remapped classes:
//2: Natural forest
//5: Natural mangrove
//3: Natural grass - unless UMD wet veg, then natural wet Grass (10)
//14: Not natural forests
//12: Crop
//14: Not natural forest
//13: Built 
//6: Natural Bare (unless UMD built, then 13, unless UMD crop, then 12)
//4: Natural water
//16: Not natural water

//Remap mapbiomas classes to natural lands classes
var indo_remap = indo.remap([3,5,13,35,21, 9,30,25,33,31,27],
                            [2,5, 3,14,12,14,13, 6, 4,16, 0]);

var indo_remap = indo_remap.where(indo_remap.eq(6).and(umdCrop.eq(1)), 12); //Remap other non-vegetated to cropland where UMD is crop
var indo_remap = indo_remap.where(indo_remap.eq(6).and(umdBuilt.gte(1)), 13); //Remap other non-vegetated to built-up where UMD is built
var indo_remap = indo_remap.where(indo_remap.eq(3).and(umdWetVeg.eq(1)), 10).toUint8(); //Remap natural short vegetation to wet natural short vegetation where UMD is wet veg

///////////////////////////////////////////////////////
/// MOSAIC ALL MAPBIOMAS AND EXPORT////
///////////////////////////////////////////////////////

var local_sa = ee.ImageCollection([amazon_remap,chaco_remap_clipped_ext,pampa_remap,atlantic_remap,brazil_remap]).mosaic().rename(['constant']).reproject({crs:umdProj});  

var world = ee.Geometry.BBox(-179.9, -60, 180, 75);
var cords = umdProj.getInfo();

var exportImage = function(image,region){
  Export.image.toAsset({
    image:image, 
    description:'mapbiomas_Indonesia_remapped_20230412', 
    assetId: 'projects/wri-datalab/SBTN/map/mapbiomas_Indonesia_remapped_20230412', 
    pyramidingPolicy:'sample', 
    region:region, 
    crs: cords['crs'], 
    crsTransform: cords['transform'], 
    maxPixels:1e13
  })
}

//exportImage(local_sa,world);
//exportImage(indo_remap, world)
