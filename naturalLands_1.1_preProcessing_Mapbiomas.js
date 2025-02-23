/*
NATURAL LANDS MAP FOR SBTN NO CONVERSION TARGET SETTING 
Version 1.1 
WRI, February 2025

MAPBIOMAS PRE-PROCESSING
This script harmonizes MapBiomas data to Natural Lands map classes, mosaics, and exports the data.
The harmonized layer is then incorporated into the Natural Lands map. 
See script titled naturalLands_1.1 for full Natural Lands map compilation process
*/

///////////////////////////////////////////////////////
/// LOAD BASE LAND COVER DATA //////////////////////// 
//////////////////////////////////////////////////////


//// UMD Land Cover--------------------------------------------------------------------------
// We overlaid UMD land cover data with the Mapbiomas data to assign more detailed classes where needed for harmonization with the Natural Lands Map, and to separate natural forest from short veg in some classes that contain both
var umdSnow = ee.Image("projects/glad/GLCLU2020/Snow_2020").selfMask();
var umdCrop = ee.Image("projects/glad/GLCLU2020/Cropland_2019").selfMask();
var umdBuilt = ee.Image("projects/glad/GLCLU2020/v2/Builtup_2020").selfMask(); 
var umdVegFraction = ee.Image("projects/glad/GLCLU2020/Vegetation_cover_2020").gte(1); // 1-100 percent cover
var treeHeight = ee.Image('projects/glad/GLCLU2020/Forest_height_2020');
var umdForest = treeHeight.gte(5); //Apply minimum height threshold of greater than or equal to 5m


var landmask = ee.Image('projects/glad/OceanMask').eq(0);
var umdWater = ee.Image('projects/glad/GLCLU2020/Water_2020').updateMask(landmask).selfMask();
var umdWater20 = umdWater.gte(20); //Apply threshold to only include water present 20% of the year or more
var water_natural = umdWater20.gte(1);

// We used the composite land cover map for classes that don't have individual assets (bare & wetland classes)
var umdLC = ee.Image('projects/glad/GLCLU2020/v2/LCLUC_2020');
// re-map the 255 values into 10 land cover classes:
// 0=bare, 1=shortVeg, 2=forest, 4=wetShortVeg, 5=wetForest, 6=water, 7=ice, 8=crop, 9=built

var FROM = ee.List([0,1])                // Bare
    .cat(ee.List.sequence(2, 26, 1))     // Short Veg
    .cat(ee.List.sequence(27, 48, 1))    // Trees
    .cat(ee.List.sequence(100, 101, 1))  // Bare (salt pan)
    .cat(ee.List.sequence(102, 126, 1))  // wet short veg
    .cat(ee.List.sequence(127, 148, 1))  // wet trees
    .cat(ee.List.sequence(200, 207, 1))  // water
    .cat(ee.List([241]))                 // snow/ice
    .cat(ee.List([244]))                 // cropland    
    .cat(ee.List([250]))                 // built-up
    
var TO =  ee.List([0,0])                 // Bare
    .cat(ee.List.repeat(1, 25))          // Short Veg
    .cat(ee.List.repeat(2, 22))          // Trees
    .cat(ee.List.repeat(0, 2))           // Bare (salt pan)
    .cat(ee.List.repeat(4, 25))          // wetland short veg
    .cat(ee.List.repeat(5, 22))          // wetland trees 
    .cat(ee.List.repeat(6, 8))           // water
    .cat(ee.List([7]))                   // snow/ice
    .cat(ee.List([8]))                   // cropland
    .cat(ee.List([9]))                   // built-up

var umd2020 = umdLC.remap(FROM,TO)
var umd_remapVis = {min:0,max:9,palette:["FEFECC","B9B91E","347834","0D570D","88CAAD","589558","6baed6","acd1e8","fff183","e8765d"]};
Map.addLayer(umd2020,umd_remapVis,'UMD LC 2020',0);

var umdBare = umd2020.eq(0);
var umdShortVeg = umd2020.eq(1).or(umd2020.eq(4));
var umdWetVeg = umd2020.eq(4);
var umdWetTrees = umd2020.eq(5);

var umdProj = umdLC.projection();
var full_palette = {min:2,max:20,palette:["246e24","B9B91E","6BAED6","06A285","fef3cc","ACD1E8","589558","093d09","dbdb7b","99991a","D3D3D3","D3D3D4","D3D3D5","D3D3D6","D3D3D7","D3D3D8","D3D3D9","D3D3D1","D3D3D2"]};

///////////////////////////////////////////////////////
/// LOAD MAPBIOMAS DATA ////
///////////////////////////////////////////////////////

//Load 2020 land cover map for each collection. 
//Reproject to UMD land cover projection

// Brazil collection 9.0
var brazil = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection9/mapbiomas_collection90_integration_v1').select('classification_2020').reproject({crs:umdProj});

// Amazon collection 6.0
var amazon = ee.Image('projects/mapbiomas-public/assets/amazon/lulc/collection6/mapbiomas_collection60_integration_v1').select('classification_2020').reproject({crs:umdProj});

// Indonesia 2.0
var indo = ee.Image('projects/mapbiomas-indonesia/public/collection2/mapbiomas_indonesia_collection2_integration_v1').select('classification_2020').reproject({crs:umdProj});

// Peru 2.0
var peru= ee.Image('projects/mapbiomas-public/assets/peru/collection2/mapbiomas_peru_collection2_integration_v1').select('classification_2020').reproject({crs:umdProj});

// Bolivia 2.0
var bol = ee.Image('projects/mapbiomas-public/assets/bolivia/collection2/mapbiomas_bolivia_collection2_integration_v1').select('classification_2020').reproject({crs:umdProj});

// Colombia 2.0
var col = ee.Image('projects/mapbiomas-public/assets/colombia/collection2/mapbiomas_colombia_collection2_integration_v1').select('classification_2020').reproject({crs:umdProj});

// Venezuela 2.0
var ven = ee.Image('projects/mapbiomas-public/assets/venezuela/collection2/mapbiomas_venezuela_collection2_integration_v1').select('classification_2020').reproject({crs:umdProj});

// Uruguay 2.0
var ury = ee.Image('projects/mapbiomas-public/assets/uruguay/collection2/mapbiomas_uruguay_collection2_integration_v1').select('classification_2020').reproject({crs:umdProj});

// Ecuador 2.0
var ecu = ee.Image('projects/mapbiomas-public/assets/ecuador/collection2/mapbiomas_ecuador_collection2_integration_v1').select('classification_2020').reproject({crs:umdProj});

// Paraguay 1.0
var par = ee.Image('projects/mapbiomas-public/assets/paraguay/collection1/mapbiomas_paraguay_collection1_integration_v1').select('classification_2020').reproject({crs:umdProj});

// Chile 1.0
var chl = ee.Image('projects/mapbiomas-public/assets/chile/collection1/mapbiomas_chile_collection1_integration_v1').select('classification_2020').reproject({crs:umdProj});

//Argentina 1.0
var arg = ee.Image('projects/mapbiomas-public/assets/argentina/collection1/mapbiomas_argentina_collection1_integration_v1').select('classification_2020').reproject({crs:umdProj});

///////////////////////////////////////////////////////
/// HARMONIZE MAPBIOMAS TO NATURAL LANDS MAP CLASSES////
///////////////////////////////////////////////////////


////MAPBIOMAS BRAZIL REMAP 
//------------------
//Original classes:
//3: Forest formation
//4: Savanna Formation
//49: Sandy coastal plain vegetation
//5: Mangrove
//6: Flooded/wet forest
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
//35: Oil palm
//21: Agricultural mosaic
//9: Forest plantation
//23: Beach, dune, sand 
//24: Urban area
//30: Mining
//25: Other non-vegetated area
//33: River, lake, ocean
//31: Aquaculture
//27: Not observed

//Remapped classes:
//2: Natural forest
//27: Placeholder (if UMD tree height gte 5 & mmu greater than 0.5, forest, otherwise, natural short vegetation)
//2: Natural forest
//5: Mangroves
//8: Natural wet forest
//10: Wet natural short vegetation
//3: Natural short vegetation
//10: Wet natural short vegetation
//6: Bare
//3: Natural short vegetation
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
//14: Non-natural tree cover
//12: Cropland
//14: Non-natural tree cover
//6: Bare
//13: Built-up
//13: Built-up
//26: Placeholder (if UMD built, then 13 [built-up]; if UMD crop, then 12 [cropland]; all else 21 [non-natural bare]) 
//4: Natural water
//16: Non-natural water
//0: No data

//Remap mapbiomas classes to natural lands classes
var brazil_remap = brazil.remap([3, 4,49,5,6,11,12,32,29,50,13,15,39,20,40,62,41,46,47,48,35,21, 9,23,24,30,25,33,31,27],
                                [2,27, 2,5,8,10, 3,10, 6, 3, 3,15,12,12,12,12,12,14,14,14,14,12,14, 6,13,13,26, 4,16,0]).toUint8();
                                
brazil_remap = brazil_remap.where(brazil_remap.eq(26).and(umdBuilt.gte(1)), 13); //Remap placeholder to built-up where UMD is built
brazil_remap = brazil_remap.where(brazil_remap.eq(26).and(umdCrop.eq(1)), 12); //Remap placeholder to cropland where UMD is crop
brazil_remap = brazil_remap.where(brazil_remap.eq(26), 21).toUint8(); //Remap placeholder to non-natural bare for all other areas
Map.addLayer(brazil_remap, full_palette, 'Brazil', false);



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
//23: Beach, dune, and sand spot
//24: Urban infrastructure
//30: Mining
//68: Other non-vegetated natural area
//25: Other non-vegetated anthropic area
//33: River, lake, ocean
//34: Glacier
//27: Not observed

//Remapped classes:
//2: Natural forest
//27:Placeholder (if UMD tree height gte 5 & mmu greater than 0.5, forest, otherwise, natural short vegetation)
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
//6: Natural bare
//13: Built-up
//13: Built-up
//6: Bare
//26: Placeholder (if UMD built, then 13 [built-up]; if UMD crop, then 12 [cropland]; all else 21 [non-natural bare])
//4: Natural Water
//7: Snow
//0: No data

//Remap mapbiomas classes to natural lands classes
var amazon_remap = amazon.remap([3, 4,5,6,11,12,13,29,15,18,35,9, 21,23,24,30,68,25,33,34,27],
                                [2,27,5,8,10, 3, 3, 6,15,12,14,14,12,6, 13,13, 6,26, 4, 7, 0]);

amazon_remap = amazon_remap.where(amazon_remap.eq(26).and(umdBuilt.gte(1)), 13); //Remap placeholder to built-up where UMD is built
amazon_remap = amazon_remap.where(amazon_remap.eq(26).and(umdCrop.eq(1)), 12); //Remap placeholder to cropland where UMD is crop
amazon_remap = amazon_remap.where(amazon_remap.eq(26), 21).toUint8(); //Remap placeholder to non-natural bare for all other areas
Map.addLayer(amazon_remap, full_palette, 'Amazon', false);


///MAPBIOMAS INDONESIA REMAP
//-------------------
//Original classes:
//3: Natural forest formation
//5: Natural Mangrove
//13: Natural non-forest formation
//40: Rice
//35: Oil Palm
//21: Other ag
//9: Forest plantation
//30: Mining
//25: Non-vegetated
//33: River, lake, ocean
//31: Aquaculture
//27: Not observed

//Remapped classes:
//2: Natural forest
//5: Natural mangrove
//3: Natural grass - unless UMD wet veg, then natural wet Grass (10)
//12: Cropland
//14: Non-natural tree cover
//12: Cropland
//14: Non-natural tree cover
//13: Built 
//6: Natural Bare (unless UMD built, then 13, unless UMD crop, then 12)
//4: Natural water
//16: Non-natural water
//0: No data

//Remap mapbiomas classes to natural lands classes
var indo_remap = indo.remap([3,5,13,40,35,21, 9,30,25,33,31,27],
                            [2,5, 3,12,14,12,14,13, 6, 4,16, 0]);

indo_remap = indo_remap.where(indo_remap.eq(6).and(umdCrop.eq(1)), 12); //Remap other non-vegetated to cropland where UMD is crop
indo_remap = indo_remap.where(indo_remap.eq(6).and(umdBuilt.gte(1)), 13); //Remap other non-vegetated to built-up where UMD is built
indo_remap = indo_remap.where(indo_remap.eq(3).and(umdWetVeg.eq(1)), 10).toUint8(); //Remap natural short vegetation to wet natural short vegetation where UMD is wet veg
Map.addLayer(indo_remap, full_palette, 'Indonesia', false);

///MAPBIOMAS PERU REMAP
//-------------------
//Original classes:
//3: Natural forest formation
//4: Savanna formation
//5: Mangrove
//6: Flooded/wet forest
//11: Wetland
//12: Grassland
//32: Salt flat
//13: Scrubland and other non-forest formations
//15: Pasture
//18: Agriculture
//35: Oil palm
//9: Forest plantation
//21: Agricultural mosaic
//24: Urban area
//30: Mining
//25: Other non-vegetated areas
//33: River, lake, and ocean
//34: Glacier
//31: Aquaculture
//27: Not observed

//Remapped classes:
//2: Natural forest
//27: Placeholder (if UMD tree height gte 5 & mmu greater than 0.5, forest, otherwise, natural short vegetation)
//5: Natural mangrove
//8: Natural wet forest
//10: Natural wet short vegetation
//3: Natural short vegetation
//10: Natural wet short vegetation
//3: Natural short vegetation
//15: Non-natural short vegetation
//12: Cropland
//14: Non-natural tree cover
//14: Non-natural tree cover
//12: Cropland
//13: Built
//13: Built
//6: Natural Bare (unless UMD built, then 13, unless UMD crop, then 12)
//4: Natural water
//7: Natural snow/ice
//16: Non-natural water
//0: No data

//Remap mapbiomas classes to natural lands classes
var peru_remap = peru.remap([3, 4,5,6,11,12,32,13,15,18,35, 9,21,24,30,25,33,34,31,27],
                            [2,27,5,8,10, 3,10, 3,15,12,14,14,12,13,13, 6, 4, 7,16, 0]);

peru_remap = peru_remap.where(peru_remap.eq(6).and(umdCrop.eq(1)), 12); //Remap natural bare to cropland where UMD is crop
peru_remap = peru_remap.where(peru_remap.eq(6).and(umdBuilt.gte(1)), 13).toUint8(); //Remap natural bare to built-up where UMD is built
Map.addLayer(peru_remap, full_palette, 'Peru', false);

///MAPBIOMAS BOLIVIA REMAP
//-------------------
//Original classes:
//3: Natural forest formation
//4: Open forest
//6: Flooded/wet forest
//11: Wetland
//12: Grassland
//29: Rocky Outcrop
//66: Shrubland
//13: Other non-forest formations
//15: Pasture
//18: Agriculture
//21: Agricultural mosaic
//24: Urban area
//30: Mining
//61: Salt flat
//68: Other non-vegetated natural areas
//25: Other non-vegetated anthropic areas
//33: River, lake, and ocean
//34: Glacier
//27: Not observed

//Remapped classes:
//2: Natural forest
//27: Placeholder (if UMD tree height gte 5 & mmu greater than 0.5, forest, otherwise, natural short vegetation)
//8: Natural wet forest
//10: Natural wet short vegetation
//3: Natural short vegetation
//6: Bare
//3: Natural short vegetation
//3: Natural short vegetation
//15: Non-natural short vegetation
//12: Cropland
//12: Cropland
//13: Built
//13: Built
//6: Natural bare
//6: Natural bare
//26: Placeholder (if UMD built, then 13 [built-up]; if UMD crop, then 12 [cropland]; all else 21 [non-natural bare])
//4: Natural water
//7: Natural snow/ice
//0: No data

//Remap mapbiomas classes to natural lands classes
var bol_remap = bol.remap([3, 4,6,11,12,29,66,13,15,18,21,24,30,61,68,25,33,34,27],
                          [2,27,8,10, 3, 6, 3, 3,15,12,12,13,13, 6, 6,26, 4, 7, 0]);

bol_remap = bol_remap.where(bol_remap.eq(26).and(umdBuilt.gte(1)), 13); //Remap placeholder to built-up where UMD is built
bol_remap =bol_remap.where(bol_remap.eq(26).and(umdCrop.eq(1)), 12); //Remap placeholder to cropland where UMD is crop
bol_remap = bol_remap.where(bol_remap.eq(26), 21).toUint8(); //Remap placeholder to non-natural bare for all other areas
Map.addLayer(bol_remap, full_palette, 'Bolivia', false);


///MAPBIOMAS COLOMBIA REMAP
//-------------------
//Original classes:
//3: Natural forest formation
//5: Mangrove
//49: Wooded sand vegetation
//6: Flooded/wet forest
//11: Wetland
//12: Grassland
//32: Hypersaline tidal flat
//29: Rocky outcrop
//50: Herbaceous sand vegetation
//13: Other non-forest formations
//35: Oil palm
//9: Forest plantation
//21: Agricultural mosaic
//23: Beach, dune, sand spot
//24: Urban area
//30: Mining
//68: Other non-vegetated natural areas
//25: Other non-vegetated anthropic areas
//33: River, lake, and ocean
//34: Glacier
//31: Aquaculture
//27: Not observed

//Remapped classes:
//2: Natural forest
//5: Mangrove
//2: Natural forest
//8: Natural wet forest
//10: Natural wet short vegetation
//3: Natural short vegetation
//10: Natural wet short vegetation
//6: Natural bare
//3: Natural short vegetation
//3: Natural short vegetation
//14: Non-natural tree cover
//14: Non-natural tree cover
//12: Cropland
//6: Natural bare
//13: Built
//13: Built
//6: Natural bare
//26: Placeholder (if UMD built, then 13 [built-up]; if UMD crop, then 12 [cropland]; all else 21 [non-natural bare])
//4: Natural water
//7: Natural snow/ice
//16: Non-natural water
//0: No data

//Remap mapbiomas classes to natural lands classes
var col_remap = col.remap([3,5,49,6,11,12,32,29,50,13,35, 9,21,23,24,30,68,25,33,34,31,27],
                          [2,5, 2,8,10, 3,10, 6, 3, 3,14,14,12, 6,13,13, 6,26, 4, 7,16, 0]);

col_remap = col_remap.where(col_remap.eq(26).and(umdBuilt.gte(1)), 13); //Remap placeholder to built-up where UMD is built
col_remap =col_remap.where(col_remap.eq(26).and(umdCrop.eq(1)), 12); //Remap placeholder to cropland where UMD is crop
col_remap = col_remap.where(col_remap.eq(26), 21).toUint8(); //Remap placeholder to non-natural bare for all other areas
Map.addLayer(col_remap, full_palette, 'Colombia', false);


///MAPBIOMAS VENEZUELA REMAP
//-------------------
//Original classes:
//3: Natural forest formation
//4: Natural savanna formation
//5: Mangrove
//6: Flooded/wet forest
//11: Wetland
//12: Grassland
//32: Hypersaline tidal flat
//29: Rocky outcrop
//50: Herbaceous sand vegetation
//13: Other non-forest formations
//15: Pasture
//18: Agriculture
//9: Forest plantation
//21: Agricultural mosaic
//23: Beach, dune, sand spot
//24: Urban area
//30: Mining
//68: Other non-vegetated natural areas
//25: Other non-vegetated anthropic areas
//33: River, lake, and ocean
//31: Aquaculture
//27: Not observed

//Remapped classes:
//2: Natural forest
//27: Placeholder (if UMD tree height gte 5 & mmu greater than 0.5, forest, otherwise, natural short vegetation)
//5: Mangrove
//8: Natural wet forest
//10: Natural wet short vegetation
//3: Natural short vegetation
//10: Natural wet short vegetation
//6: Natural bare
//3: Natural short vegetation
//3: Natural short vegetation
//15: Non-natural short vegetation
//12: Cropland
//14: Non-natural tree cover
//12: Cropland
//6: Natural bare
//13: Built
//13: Built
//6: Natural bare
//26: Placeholder (if UMD built, then 13 [built-up]; if UMD crop, then 12 [cropland]; all else 21 [non-natural bare])
//4: Natural water
//16: Non-natural water
//0: No data

//Remap mapbiomas classes to natural lands classes
var ven_remap = ven.remap([3, 4,5,6,11,12,32,29,50,13,15,18, 9,21,23,24,30,68,25,33,31,27],
                          [2,27,5,8,10, 3,10, 6, 3, 3,15,12,14,12, 6,13,13, 6,26, 4,16, 0]);

ven_remap = ven_remap.where(ven_remap.eq(26).and(umdBuilt.gte(1)), 13); //Remap placeholder to built-up where UMD is built
ven_remap =ven_remap.where(ven_remap.eq(26).and(umdCrop.eq(1)), 12); //Remap placeholder to cropland where UMD is crop
ven_remap = ven_remap.where(ven_remap.eq(26), 21).toUint8(); //Remap placeholder to non-natural bare for all other areas
Map.addLayer(ven_remap, full_palette, 'Venezuela', false);


///MAPBIOMAS URUGUAY REMAP
//-------------------
//Original classes:
//3: Natural forest formation
//11: Wetland
//12: Grassland
//15: Pasture
//19: Temporary Crop
//9: Forest plantation
//22: Non-vegetated area
//33: River, lake, and ocean
//27: Not observed

//Remapped classes:
//2: Natural forest
//10: Natural wet short vegetation
//3: Natural short vegetation
//15: Not-natural short vegetation
//12: Cropland
//14: Non-natural tree cover
//26: Placeholder (if UMD built, then 13 [built-up]; if UMD crop, then 12 [cropland]; all else 6 [natural bare])
//4: Natural water
//0: No data

//Remap mapbiomas classes to natural lands classes
var ury_remap = ury.remap([3,11,12,15,19, 9,22,33,27],
                          [2,10, 3,15,12,14,26, 4, 0]);

ury_remap = ury_remap.where(ury_remap.eq(26).and(umdBuilt.gte(1)), 13); //Remap placeholder to built-up where UMD is built
ury_remap =ury_remap.where(ury_remap.eq(26).and(umdCrop.eq(1)), 12); //Remap placeholder to cropland where UMD is crop
ury_remap = ury_remap.where(ury_remap.eq(26), 6).toUint8(); //Remap placeholder to natural bare for all other areas
Map.addLayer(ury_remap, full_palette, 'Uruguay', false);


///MAPBIOMAS ECUADOR REMAP
//-------------------
//Original classes:
//3: Natural forest formation
//4: Natural savanna formation
//5: Mangrove
//6: Flooded/wet forest
//11: Wetland
//12: Grassland
//29: Rocky outcrop
//13: Other non-forest formations
//9: Forest plantation
//21: Agricultural mosaic
//23: Beach, dune and sand spot
//24: Urban infrastructure
//30: Mining
//68: Other non-vegetated natural areas
//25: Other non-vegetated anthropic areas
//33: River, lake, and ocean
//34: Glacier
//31: Aquaculture
//27: Not observed

//Remapped classes:
//2: Natural forest
//27: Placeholder (if UMD tree height gte 5 & mmu greater than 0.5, forest, otherwise, natural short vegetation)
//5: Mangrove
//8: Natural wet forest
//10: Natural wet short vegetation
//3: Natural short vegetation
//6: Natural bare
//3: Natural short vegetation
//14: Non-natural tree cover
//12: Cropland
//6: Natural bare
//13: Built
//13: Built
//6: Natural bare
//26: Placeholder (if UMD built, then 13 [built-up]; if UMD crop, then 12 [cropland]; all else 21 [non-natural bare])
//4: Natural water
//7: Natural snow/ice
//16: Non-natural water
//0: No data

//Remap mapbiomas classes to natural lands classes
var ecu_remap = ecu.remap([3, 4,5,6,11,12,29,13, 9,21,23,24,30,68,25,33,34,31,27],
                          [2,27,5,8,10, 3, 6, 3,14,12, 6,13,13, 6,26, 4, 7,16, 0]);

ecu_remap = ecu_remap.where(ecu_remap.eq(26).and(umdBuilt.gte(1)), 13); //Remap placeholder to built-up where UMD is built
ecu_remap =ecu_remap.where(ecu_remap.eq(26).and(umdCrop.eq(1)), 12); //Remap placeholder to cropland where UMD is crop
ecu_remap = ecu_remap.where(ecu_remap.eq(26), 21).toUint8(); //Remap placeholder to non-natural bare for all other areas
Map.addLayer(ecu_remap, full_palette, 'Ecuador', false);


///MAPBIOMAS PARAGUAY REMAP
//-------------------
//Original classes:
//3: Natural forest formation
//4: Natural savanna formation
//6: Flooded natural forest
//11: Wetland
//12: Grassland
//15: Pasture
//19: Agriculture
//9: Forest plantation
//22: Non-vegetated area
//33: River, lake, and ocean
//27: Not observed

//Remapped classes:
//2: Natural forest
//27: Placeholder (if UMD tree height gte 5 & mmu greater than 0.5, forest, otherwise, natural short vegetation)
//8: Natural wet forest
//10: Natural wet short vegetation
//3: Natural short vegetation
//15: Non-natural short vegetation
//12: Cropland
//14: Non-natural tree cover
//26: Placeholder (if UMD built, then 13 [built-up]; if UMD crop, then 12 [cropland]; all else 6 [natural bare])
//4: Natural water
//0: No data

//Remap mapbiomas classes to natural lands classes
var par_remap = par.remap([3, 4,6,11,12,15,19, 9,22,33,27],
                          [2,27,8,10, 3,15,12,14,26, 4, 0]);

par_remap = par_remap.where(par_remap.eq(26).and(umdBuilt.gte(1)), 13); //Remap placeholder to built-up where UMD is built
par_remap =par_remap.where(par_remap.eq(26).and(umdCrop.eq(1)), 12); //Remap placeholder to cropland where UMD is crop
par_remap = par_remap.where(par_remap.eq(26), 6).toUint8(); //Remap placeholder to natural bare for all other areas
Map.addLayer(par_remap, full_palette, 'Paraguay', false);


///MAPBIOMAS CHILE REMAP
//-------------------
//Original classes:
//3: Natural forest formation
//11: Wetland
//12: Grassland
//66: Shrubland
//29: Rocky outcrop
//9: Forest plantation
//21: Agricultural mosaic
//23: Beach, dune, and sand spot
//24: Infrastructure
//61: Salt flat
//25: Other non-vegetated area
//33: River, lake, and ocean
//34: Ice and snow
//27: Not observed

//Remapped classes:
//2: Natural forest
//10: Natural wet short vegetation
//3: Natural short vegetation
//3: Natural short vegetation
//6: Natural bare
//14: Non-natural tree cover
//12: Cropland
//6: Natural bare
//13: Built
//6: Natural bare
//26: Placeholder (if UMD built, then 13 [built-up]; if UMD crop, then 12 [cropland]; all else 6 [natural bare])
//4: Natural water
//7: Natural snow/ice
//0: No data


//Remap mapbiomas classes to natural lands classes
var chl_remap = chl.remap([3,11,12,66,29, 9,21,23,24,61,25,33,34,27],
                          [2,10, 3, 3, 6,14,12, 6,13, 6,26, 4, 7, 0]);

chl_remap = chl_remap.where(chl_remap.eq(26).and(umdBuilt.gte(1)), 13); //Remap placeholder to built-up where UMD is built
chl_remap =chl_remap.where(chl_remap.eq(26).and(umdCrop.eq(1)), 12); //Remap placeholder to cropland where UMD is crop
chl_remap = chl_remap.where(chl_remap.eq(26), 6).toUint8(); //Remap placeholder to natural bare for all other areas
Map.addLayer(chl_remap, full_palette, 'Chile', false);

///MAPBIOMAS ARGENTINA REMAP
//-----------------------------------
//Original classes:
// 3: Natural forest
// 4: Natural open woodland 
// 45: Sparse woodland
// 6: Wet Forest
// 11: Wetland
// 12: Grassland
// 63: Steppe
// 15: Pasture
// 18: Agriculture
// 9: Forest plantation
// 36: Shrub plantation
// 21: Agricultural mosaic
// 22: Non-vegetated
// 33: River, lake, ocean
// 34: Snow and ice
// 27: Not observed

//Remapped classes:
// 2: Natural forest
// 27: Placeholder (if UMD tree height gte 5 & mmu greater than 0.5, forest, otherwise, natural short vegetation)
// 27: Placeholder (if UMD tree height gte 5 & mmu greater than 0.5, forest, otherwise, natural short vegetation) 
// 8: Wet natural forest
// 10: Wet natural short vegetation
// 3: Natural short vegetation 
// 3: Natural short vegetation 
// 15: Non-natural short vegetation 
// 12: Cropland
// 14: Non-natural tree cover
// 12: Cropland
// 12: Cropland
// 6: Natural Bare (unless UMD built, then 13, unless UMD crop, then 12) 
// 4: Natural water 
// 7: Natural snow/ice
// 0: No data

//Remap mapbiomas classes to natural lands classes
var arg_remap = arg.remap([3, 4,45,6,11,12,63,15,18, 9,36,21,22,33,34,27],
                          [2,27,27,8,10, 3, 3,15,12,14,12,12, 6, 4, 7, 0]);

arg_remap = arg_remap.where(arg_remap.eq(6).and(umdBuilt.gte(1)), 13); //Remap natural bare to built-up where UMD is built
arg_remap = arg_remap.where(arg_remap.eq(6).and(umdCrop.eq(1)), 12).toUint8(); //Remap natural bare to cropland where UMD is crop
Map.addLayer(arg_remap, full_palette, 'Argentina', false);

/////////////////////////////////////////////////////////////////////////////////////
/// MOSAIC ALL MAPBIOMAS, SEGMENT SAVANNAS INTO SHORT VEG AND FORESTS, AND EXPORT////
////////////////////////////////////////////////////////////////////////////////////

//Mosaic all South America collections
var local_sa = ee.ImageCollection([amazon_remap, ury_remap, par_remap, arg_remap, chl_remap, peru_remap, bol_remap, col_remap, ven_remap, ecu_remap, brazil_remap]).mosaic().rename(['constant']).reproject({crs:umdProj});  

//Overlay tree height data with mixed short veg/forest classes                            
var mixedForest = local_sa.eq(27).and(umdForest.eq(1)).selfMask();

////Apply 0.5 ha MMU
// Count connected pixels: 
var pixel_countF = mixedForest.connectedPixelCount({eightConnected:true}).reproject({crs:umdProj});
// Calculate pixel area:
var pixelAreaF = ee.Image.pixelArea().reproject({crs:umdProj});
// Multiply pixel count x area: 
var objectAreaF = pixel_countF.multiply(pixelAreaF);
// Set threshold (m^2) and apply:
var mmu = 5000;
var mmu_maskF = objectAreaF.gte(mmu);

// Create natural forest with mmu applied
var forest_natmmu = mixedForest.updateMask(mmu_maskF);

// Update classification
local_sa = local_sa.where(forest_natmmu.eq(1).and(local_sa.eq(27)), 2); //Tree height greater than or equal to 5m and 0.5 ha mmu reclassified to forest
local_sa = local_sa.where(local_sa.eq(27), 3); //Otherwise, short vegetation

Map.addLayer(local_sa, full_palette, 'Mapbiomas combined', false);

var world = ee.Geometry.BBox(-179.9, -60, 180, 75);
var cords = umdProj.getInfo();

var exportImage = function(image,region){
  Export.image.toAsset({
    image:image, 
    description:'mapbiomas_southAmerica_remapped_v1_1_20250122', 
    assetId: 'projects/wri-datalab/SBTN/map/mapbiomas_southAmerica_remapped_v1_1_20250122', 
    pyramidingPolicy:'sample', 
    region:region, 
    crs: cords['crs'], 
    crsTransform: cords['transform'], 
    maxPixels:1e13
  })
}

//exportImage(local_sa,world);
//exportImage(indo_remap, world)
