/*
NATURAL LANDS MAP FOR SBTN NO CONVERSION TARGET SETTING
Version 1.1 
WRI, Feburary 2025

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
var umdBuilt = ee.Image("projects/glad/GLCLU2020/v2/Builtup_2020").selfMask();
var umdVegFraction = ee.Image("projects/glad/GLCLU2020/Vegetation_cover_2020").gte(1); // 1-100 percent cover
var treeHeight = ee.Image('projects/glad/GLCLU2020/Forest_height_2020');
var umdForest = treeHeight.gte(5); // Apply minimum height threshold of greater than or equal to 5m

var umdProj = umdForest.projection();

var landmask = ee.Image('projects/glad/OceanMask').eq(0);
var caspianSea = ee.FeatureCollection('projects/wri-datalab/SBTN/CaspianSea');
var caspianSea_poly = caspianSea.map(function(feat) {
  return feat.set('sea',1);
});
var caspian = caspianSea_poly.reduceToImage(['sea'], ee.Reducer.first()).reproject({crs:umdProj}).rename(['b1']);
// EXPORT THIS FOR FASTER PROCESSING^
var landmask_wCaspian = ee.ImageCollection([landmask,caspian.eq(1).multiply(0)]).mosaic();


var umdWater = ee.Image('projects/glad/GLCLU2020/Water_2020').updateMask(landmask_wCaspian).selfMask();
var umdWater20 = umdWater.gte(20); // Apply threshold to only include water present 20% of the year or more
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
    .cat(ee.List([250]));                 // built-up
    
var TO =  ee.List([0,0])                 // Bare
    .cat(ee.List.repeat(1, 25))          // Short Veg
    .cat(ee.List.repeat(2, 22))          // Trees
    .cat(ee.List.repeat(0, 2))           // Bare (salt pan)
    .cat(ee.List.repeat(4, 25))          // wetland short veg
    .cat(ee.List.repeat(5, 22))          // wetland trees 
    .cat(ee.List.repeat(6, 8))           // water
    .cat(ee.List([7]))                   // snow/ice
    .cat(ee.List([8]))                   // cropland
    .cat(ee.List([9]));                  // built-up

var umd2020 = umdLC.remap(FROM,TO);
var umd_remapVis = {min:0,max:9,palette:["FEFECC","B9B91E","347834","0D570D","88CAAD","589558","6baed6","acd1e8","fff183","e8765d"]};
Map.addLayer(umd2020,umd_remapVis,'UMD LC 2020',0);

var umdBare = umd2020.eq(0).updateMask(landmask_wCaspian);
var umdShortVeg = umd2020.eq(1).or(umd2020.eq(4));
var umdWetVeg = umd2020.eq(4);
var umdWetTrees = umd2020.eq(5);


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

// Mosaic WC grass, shrub, and wetland classes to form a short vegetation class
var wcShortVeg = ee.ImageCollection([wcGrass,wcShrub,wcWetland]).mosaic().gte(1).setDefaultProjection({crs:wcProj}); 

// Reproject 10m short veg data to 30m: 
var shortVeg30 = wcShortVeg.reduceResolution({reducer: ee.Reducer.mode()})
                           .reproject({crs:umdProj}).selfMask();
// EXPORT THIS FOR FASTER PROCESSING^


// Mosaic WC bare and moss classes to form bare ground class
var wcBareG = ee.ImageCollection([wcBare,wcMoss]).mosaic().gte(1).setDefaultProjection({crs:wcProj});
// Reproject 10m bare data to 30m: 
var wcBareG = wcBareG.reduceResolution({reducer: ee.Reducer.mode()})
                     .reproject({crs:umdProj}).selfMask();
// EXPORT THIS FOR FASTER PROCESSING ^   



///////////////////////////////////////////////////////
/// SUPPLEMENTARY DATA ////
///////////////////////////////////////////////////////


//// Global Pasture Watch (GPW) - Cultivated Grasslands----------------------------------------------------
var dominant = ee.ImageCollection("projects/global-pasture-watch/assets/ggc-30m/v1/grassland_c");
var cultiv_grassland_p = ee.ImageCollection("projects/global-pasture-watch/assets/ggc-30m/v1/cultiv-grassland_p");
var nat_semi_grassland_p = ee.ImageCollection("projects/global-pasture-watch/assets/ggc-30m/v1/nat-semi-grassland_p");


//// Global Mangrove Watch 2020--------------------------------------------------------------------------
var gmwMangroves = ee.FeatureCollection('projects/wri-datalab/SBTN/Mangrove_GMW_v3_2020');

// Convert vector to binary raster:
var mangroves_poly = gmwMangroves.map(function(feat) {
  return feat.set('gmw',1);
});
var mangroves = mangroves_poly.reduceToImage(['gmw'], ee.Reducer.first()).reproject({crs:umdProj});
// EXPORT THIS FOR FASTER PROCESSING ^


////Mining Areas--------------------------------------------------------------------------
//combined layer that includes mining polygons from Maus et al 2022, Tang et al 2023, Dethier et al 2023
var miningCombined = ee.FeatureCollection('users/radoststanimirova/mining_combined');

// Convert vector to binary raster:
var minePoly = miningCombined.map(function(feat) {
  return feat.set('mines',1);
});
var minesRaster = minePoly.reduceToImage(['mines'], ee.Reducer.first()).reproject({crs:umdProj});
// EXPORT THIS FOR FASTER PROCESSING ^

// Select only areas in mines that are bare or have water. These will be labelled non-natural  
var mines = minesRaster.where(wcBareG.eq(1).or(umdBare.eq(1)),2);
var mines = mines.where(mines.eq(1).and(umdWater20.eq(1)),2).eq(2);


//// WRI Peatland--------------------------------------------------------------------------
var wriPeat1 = ee.Image('projects/wri-datalab/SBTN/Peat_WRI/10N_10S_peat_mask_processed');
var wriPeat2 = ee.Image('projects/wri-datalab/SBTN/Peat_WRI/20-30N_20-30S_peat_mask_processed');
var wriPeat3 = ee.Image('projects/wri-datalab/SBTN/Peat_WRI/40-50N_40-50S_peat_mask_processed');
var wriPeat4 = ee.Image('projects/wri-datalab/SBTN/Peat_WRI/60-80N_60-80S_peat_mask_processed');
var wriPeat = ee.ImageCollection([wriPeat1,wriPeat2,wriPeat3,wriPeat4]).mosaic();


//// USGS Global Cropland Extent (2015, 30m)------------------------------------------------------
var gcep30 = ee.ImageCollection("projects/sat-io/open-datasets/GFSAD/GCEP30").mosaic().eq(2).selfMask();
var usgsCrop = gcep30.reproject({crs:umdProj});
// EXPORT THIS FOR FASTER PROCESSING ^


//// ESA WorldCereal Active Cropland (2020-2021, 10m)------------------------------------------------
// Select only pixels that had active cropland starting in 2020 (avoids new 2021 cropland)
var worldCereal_markers_2020 = ee.ImageCollection("ESA/WorldCereal/2021/MARKERS/v100").filterDate('2020-06-01', '2021-01-01');
var worldCereal_markers_2020_mosaic = worldCereal_markers_2020
                                      .qualityMosaic('classification').select('classification').eq(100);

var worldCereal_markers_2020_winterCereals = worldCereal_markers_2020.filter('season=="tc-wintercereals"')
                                             .qualityMosaic('classification').select('classification').eq(100).selfMask();
var worldCereal_markers_2020_maizeMain = worldCereal_markers_2020.filter('season=="tc-maize-main"')
                                             .qualityMosaic('classification').select('classification').eq(100).selfMask();
var worldCereal_markers_2020_maizeSecond = worldCereal_markers_2020.filter('season=="tc-maize-second"')
                                             .qualityMosaic('classification').select('classification').eq(100).selfMask();

var worldCereal_markers_combined = ee.ImageCollection([worldCereal_markers_2020_winterCereals,
                        worldCereal_markers_2020_maizeMain,worldCereal_markers_2020_maizeSecond])
                        .qualityMosaic('classification').select('classification').rename(['constant']).selfMask();

// Reproject 10m data to 30m
var cereal_Proj = worldCereal_markers_2020.first().projection();
var worldCereal_reprojected = worldCereal_markers_combined.gt(0).setDefaultProjection({crs:cereal_Proj});
var esaWorldCereal = worldCereal_reprojected.reduceResolution({reducer: ee.Reducer.mode()})
                                            .reproject({crs:umdProj}).selfMask();
// EXPORT THIS FOR FASTER PROCESSING ^


//// Global Closed-Canopy Coconut (Descals et al. 2023)---------------------------------------------
var coco_raw = ee.ImageCollection('projects/ee-globaloilpalm/assets/_COCONUT/results/GCL_2020_v1-1');
var cocoProj = coco_raw.first().projection();

var coco = ee.ImageCollection('projects/ee-globaloilpalm/assets/_COCONUT/results/GCL_2020_v1-1')
  .filter(ee.Filter.neq('system:index','GCL_2020_46268_v1-1'))
  .filter(ee.Filter.neq('system:index','GCL_2020_46422_v1-1'))
  .filter(ee.Filter.neq('system:index','GCL_2020_46423_v1-1'))
  .filter(ee.Filter.neq('system:index','GCL_2020_46424_v1-1'))
  .filter(ee.Filter.neq('system:index','GCL_2020_46578_v1-1'))
  .filter(ee.Filter.neq('system:index','GCL_2020_46579_v1-1'))
  .filter(ee.Filter.neq('system:index','GCL_2020_46580_v1-1'))
  .filter(ee.Filter.neq('system:index','GCL_2020_46736_v1-1'))
  .filter(ee.Filter.neq('system:index','GCL_2020_05195_v1-1'))
  .mosaic().setDefaultProjection({crs:cocoProj});

// Reproject 10m data to 30m
var globalCoco = coco.reduceResolution({reducer: ee.Reducer.mode()})
                                  .reproject({crs:umdProj})
                                  .selfMask().rename(['constant']);
// EXPORT THIS FOR FASTER PROCESSING ^



///////////////////////////////////////////////////////
/// LOCAL DATA ////
///////////////////////////////////////////////////////

//// MAPBIOMAS--------------------------------------------------------------------------
/// PROCESSING OF MAPBIOMAS WERE DONE IN A DIFFERENT SCRIPT: see naturalLands_1.1_preProcessing_Mapbiomas
// Brazil collection 9.0 (2020)
// Amazon collection 6.0 (2020)
// Indonesia collection 2.0 (2020)
// Peru collection 2.0 (2020)
// Bolivia collection 2.0 (2020)
// Colombia collection 2.0 (2020)
// Venezuela collection 2.0 (2020)
// Uruguay collection 2.0 (2020)
// Ecuador collection 2.0 (2020)
// Paraguay collection 1.0 (2020)
// Chile collection 1.0 (2020)
// Argentina collection 1.0 (2020)

// Mapbiomas data were re-projected, harmonized to natural lands map classes, mosaicked, and then exported. 
// South America
var mapbiomas_sa = ee.Image('projects/wri-datalab/SBTN/map/mapbiomas_southAmerica_remapped_v1_1_20250122').rename(['constant']).selfMask();  

// Indonesia
var mapbiomas_idn = ee.Image('projects/wri-datalab/SBTN/map/mapbiomas_Indonesia_remapped_v1_20240503').rename(['constant']).selfMask(); 


//// South Africa National Land Cover--------------------------------------------------------------------------
var southAfrica = ee.Image('projects/wri-datalab/SBTN/Local_data/SouthAfrica_NLC_2020').rename(['constant']);
// Remap to natural lands classes:
var sa_remap = southAfrica.remap([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
                                 [2,26,26,26,14,14,14, 3, 3, 3,  3,  3,  3,   4,  4,  4,  4,  4, 16, 16, 16, 10, 10,  5,  6,  6,  6,  6,  6,  6,  6, 14, 12, 12, 12, 12, 12, 12, 12, 12, 12,  2,  3,  3,  6,  3, 14, 15, 15, 13, 14, 15, 15, 13, 13, 13, 14, 15, 15, 13, 14, 15, 15, 13, 13, 13, 13, 13, 13, 13, 13, 13, 10]);

// Reproject 20m reclassified South Africa Land Cover data to 30m:
var sa_nlc = sa_remap.reduceResolution({reducer: ee.Reducer.mode()})
                          .reproject({crs:umdProj})
                          .selfMask();

// Overlay UMD tree height data with mixed short veg/forest classes (remapped as 26)                            
var mixedForestSA = sa_nlc.eq(26).and(umdForest.eq(1)).selfMask();

// Count connected pixels for UMD Forest in mixed classes to apply 0.5 ha MMU
var pixel_countForestSA = mixedForestSA.connectedPixelCount({eightConnected:true}).reproject({crs:umdProj});
// Calculate pixel area
var pixelAreaForestSA = ee.Image.pixelArea().reproject({crs:umdProj});
// Multiply pixel count x area 
var objectAreaForestSA = pixel_countForestSA.multiply(pixelAreaForestSA);
// Set MMU threshold (m^2) and apply
var mmu_forest = 5000;
var mmu_maskForestSA = objectAreaForestSA.gte(mmu_forest);

// Create natural forest with mmu applied
var mixedNatForest_mmu = mixedForestSA.updateMask(mmu_maskForestSA);

// Update classification
sa_nlc = sa_nlc.where(mixedNatForest_mmu.eq(1).and(sa_nlc.eq(26)), 2); //Tree height greater than or equal to 5m and 0.5 ha mmu reclassified to forest
sa_nlc = sa_nlc.where(sa_nlc.eq(26), 3); //Otherwise, natural short vegetation
// EXPORT THIS FOR FASTER PROCESSING ^


//// New Zealand LUCAS Land Cover--------------------------------------------------------------------------
/// PROCESSING OF NZ DATA WERE DONE IN A DIFFERENT SCRIPT: see naturalLands_1_preProcessing_NZ_Lucas
var nzReprojected = ee.Image('projects/wri-datalab/SBTN/map/newZealand_LC_remapped');
var nzRemap = nzReprojected.remap([1,	2,	3,	10,	11,	12,	13,		20,	21,	22,	23,	24,	30,	31,		32,	33,	34,	35,		36,	37,	38,	40,	41,	50,	51,	52,	60,	61,	70,	80,],
                                  [2,	2,	2,	14,	14,	14,	14,		2,	14,	14,	14,	2,	3,	15,		15,	15,	15,	3,		3,	3,	3,	12,	12,	4,	4,	16,	10,	17,	13,	6,]);
var nzRemap = nzRemap.rename(['constant']);


//// ETH/EcoVision Cocoa Map--------------------------------------------------------------------------
var cocoa_map_th = ee.Image('projects/ee-nk-cocoa/assets/cocoa_map_threshold_065');

// Reproject 10m binary cocoa data to 30m
var ethCocoa = cocoa_map_th.reduceResolution({reducer: ee.Reducer.mode()})
                          .reproject({crs:umdProj})
                          .selfMask().rename(['constant']);
// EXPORT THIS FOR FASTER PROCESSING ^


//// CORINE Land Cover--------------------------------------------------------------------------
var corine = ee.Image('COPERNICUS/CORINE/V20/100m/2018');
var corine_natGrass_orig = corine.remap([321,322,323],[1,1,1]);

// Reproject 100m data to 30m
var corine_natGrass = corine_natGrass_orig.reproject({crs:umdProj})
                          .rename(['constant'])
                          .selfMask();
// EXPORT THIS FOR FASTER PROCESSING ^


//// USGS National Land Cover Database ----------------------------------------------------------
var nlcd = ee.Image('projects/wri-datalab/SBTN/map/Annual_NLCD_LndCov_2020_CU_C1V0');
var nlcd2020 = nlcd.rename(['constant']).reproject({crs:umdProj});
// EXPORT THIS FOR FASTER PROCESSING ^


////DEA cropland extent -------------------------------------------------------------------------
var dea_raw= ee.ImageCollection('projects/sat-io/open-datasets/DEAF/CROPLAND-EXTENT/filtered');
var dea = dea_raw.mosaic().setDefaultProjection(dea_raw.first().projection());

//Reproject 10m data to 30m
var deaCropland = dea.reduceResolution({reducer: ee.Reducer.mode()})
                .reproject({crs: umdProj})
                .selfMask().rename(['constant']);
// EXPORT THIS FOR FASTER PROCESSING ^


///////////////////////////////////////////////////////
/// MAKING FORESTS ////
///////////////////////////////////////////////////////

// NATURAL FOREST LAYER
// The natural forest layer is made by removing the SDPT v2 and Global Closed-canopy Coconut (Descals et al. 2023) 
//    from the UMD 2020 forest extent. 
// SDPT v2 uses Lesiv et al for European countries and for any country without coverage from other data sources in the SDPT, 
//    and with plantation or planted forest > 0 according to the 2020 FAO FRA
// Before removing SDPT v2, forests within Intact Forest Landscapes 2020 and Sabatini et al. 
//    European primary forests are masked, so that these areas of potentially primary/old growth forests are not removed. 
// This is an added precaution due to the mix of resolutions of input data in SDPT

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
// This masks out these areas from the SDPT v2 data, so that when we remove SDPT v2 from the forests layer, 
//    we are not removing areas that overlap with Sabatini primary or IFL 2020
// This helps to ensure we are not removing tree cover that might be primary forest
var sdpt_mask = sdptv2.where(sabatini.eq(1), 0);
var sdpt_mask = sdpt_mask.where(ifl_2020.eq(1), 0);


//// PREPARE FOREST LAYER--------------------------------------------------------------------------------
// Remove SDPT and global coconut from UMD Forest extent:
var forest_natural = umdForest.where(sdpt_mask.eq(1), 0);
var forest_natural = forest_natural.where(globalCoco.eq(1), 0);

// All forest that was removed is classified as non-natural:
var forest_notNatural = umdForest.selfMask().updateMask(forest_natural.not());



///////////////////////////////////////////////////////
/// MAKING SHORT VEGETATION & BARE////
///////////////////////////////////////////////////////

// NATURAL SHORT VEGETATION & BARE CLASSES
// The natural short vegetation and bare layers are made by removing GPW cultivated grasslands from the ESA WorldCover 
//    grassland, shrubland, and wetland classes, and both ESA and UMD bare classes. Then the coconut layer is overlaid 
//    when compiling below. 

var cultivated = dominant.filter(ee.Filter.eq('system:index','2020')).first().eq(1);


//// PREPARE SHORT VEG LAYER--------------------------------------------------------------------------------

// Remove cultivated grasslands from short vegetation layer and classify remaining short veg as natural: 
var shortVeg_natural = shortVeg30.unmask().gt(0).updateMask(cultivated.gt(0).unmask().not());

// Label masked short vegetation as not-natural:
var shortVeg_notNatural = shortVeg30.selfMask().updateMask(shortVeg_natural.unmask().not());


///// PREPARE BARE LAYER --------------------------------------

var bare = ee.ImageCollection([umdBare.eq(1).rename(['constant']),wcBareG.eq(1).rename(['constant'])]).mosaic()

// Remove cultivated grassland from bare layer and classify remaining bare as natural: 
var bare_natural = bare.unmask().gt(0).updateMask(cultivated.gt(0).unmask().not());

// Label masked bare as not-natural:
var bare_notNatural = bare.selfMask().updateMask(bare_natural.unmask().not());


///////////////////////////////////////////////////////
/// MAKING INTERMEDIATE NATURAL LANDS ////
///////////////////////////////////////////////////////
// This step combines all classes to create an intermediate version of the full natural lands map. 
// A minimum mapping unit of 0.5 ha will then be applied to the resulting natural forests, short vegetation, and bare classes. 

var blank = ee.Image(1);

//// NATURAL CLASSES------------------------------------
var tempNatural = blank.where(forest_natural.eq(1),2);                                 //forests = 2
var tempNatural = tempNatural.where(tempNatural.eq(1).and(shortVeg_natural.eq(1)), 3); //short veg = 3
var tempNatural = tempNatural.where(tempNatural.eq(1).and(water_natural.eq(1)), 4);    //water = 4 
var tempNatural = tempNatural.where(mangroves.eq(1), 5);                               //mangroves = 5 
var tempNatural = tempNatural.where(tempNatural.eq(1).and(bare_natural.eq(1)), 6);     //bare = 6
var tempNatural = tempNatural.where(tempNatural.eq(1).and(umdSnow.eq(1)), 7);          //snow = 7

//// NON-NATURAL CLASSES---------------------------------
var tempAll = tempNatural.where(tempNatural.eq(1).and(forest_notNatural.eq(1)), 14);   //non natural tree cover = 14
var tempAll = tempAll.where(globalCoco.eq(1).and(tempAll.eq(3)), 15);                  //non natural short veg = 15  
var tempAll = tempAll.where(sdpt_mask.eq(1).and(tempAll.eq(3)), 15);                   //non natural short veg = 15
var tempAll = tempAll.where(sdpt_mask.eq(1).and(tempAll.eq(6)), 21);                   //non natural bare = 21
var tempAll = tempAll.where(tempAll.eq(1).and(shortVeg_notNatural.eq(1)), 15);         //non natural short veg = 15
var tempAll = tempAll.where(tempAll.eq(1).and(bare_notNatural.eq(1)), 21);             //non natural bare = 21
var tempAll = tempAll.where(umdCrop.eq(1), 12);                                        //cropland = 12
var tempAll = tempAll.where(usgsCrop.eq(1), 12);                                       //cropland = 12
var tempAll = tempAll.where(esaWorldCereal.eq(1), 12);                                 //cropland = 12
var tempAll = tempAll.where(umdBuilt.gte(1), 13);                                      //built-up = 13
var tempAll = tempAll.where(mines.eq(1), 13);                                          //built-up = 13

var intermediateMap = tempAll.updateMask(tempAll.gt(1));
Map.addLayer(intermediateMap, {min:2, max:16, palette: ["347834","B9B91E","6BAED6","06A285","FEFECC","ACD1E8",'ffffff','ffffff','ffffff','ffffff',"D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3",]}, 'intermediateMap',0);


////////////////////////////////////////////////////////
// MOSAIC LOCAL ONE CLASS DATA TOGETHER ///////
///////////////////////////////////////////////////////

//// Harmonize ETH cocoa-----------------------------
var harmonizedCocoa = ethCocoa.where(ethCocoa.eq(1), 14); // Remap all cocoa to non-natural tree cover
var harmonizedCocoa = harmonizedCocoa.where(intermediateMap.eq(12), 12); // Remap to cropland where applicable, since crop has higher priority when combining classes
var harmonizedCocoa = harmonizedCocoa.where(intermediateMap.eq(13), 13).toUint8(); // Remap to built-up where applicable, since built has higher priority when combining classes

//// Select only CORINE Natural Grasslands where we call it short vegetation (3=dry, 10=wet)
var corine_natShortVeg = corine_natGrass.where(corine_natGrass.eq(1).and(intermediateMap.eq(15)),3); // Remap non-nat short veg to natural where CORINE nat short veg
var corine_natShortVeg = corine_natShortVeg.where(corine_natGrass.eq(1).and(intermediateMap.eq(19)),10); // Remap wetland non-nat short veg to natural where CORINE nat short veg
var corine_natShortVeg = corine_natShortVeg.updateMask(corine_natShortVeg.gt(1)).toUint8();

//// Harmonize DEA Cropland--------------------------
var harmonizedDEA = deaCropland.where(deaCropland.eq(1), 12); //Remap to cropland value
var harmonizedDEA = harmonizedDEA.where(intermediateMap.eq(13), 13).toUint8(); // Remap to built-up where applicable, since built has higher priority when combining classes

//// Harmonize USGS NLCD Data-----------------------
var nlcd_notNat = nlcd2020.remap([21,22,23,24,81,82],[13,13,13,13,15,12]).rename(['constant']).toUint8();

//// Mosaic all local data together------------------
var local_intermediate = ee.ImageCollection([nlcd_notNat.clamp(1,15), harmonizedDEA.clamp(1,15), corine_natShortVeg.clamp(1,15), harmonizedCocoa.clamp(1,15)]).mosaic();

var intermediateMap_wLocal = ee.ImageCollection([intermediateMap, local_intermediate]).mosaic();
Map.addLayer(intermediateMap_wLocal, {min:2, max:16, palette: ["347834","B9B91E","6BAED6","06A285","FEFECC","ACD1E8",'ffffff','ffffff','ffffff','ffffff',"ded485","bd6c5b","bdbdbd","969696","737373","D3D3D3","D3D3D3","D3D3D3","D3D3D3",]}, 'intermediateMap_wLocal',0);


///////////////////////////////////////////////////////////////
///  APPLYING MINIMUM MAPPING UNIT TO FORESTS ///
///////////////////////////////////////////////////////////////

var natForests = intermediateMap_wLocal.eq(2);
var natShortveg = intermediateMap_wLocal.eq(3);
var natBare = intermediateMap_wLocal.eq(6);


//// FOREST MMU-----------------------------------
// Count connected pixels: 
var pixel_countF = natForests.connectedPixelCount({eightConnected:true}).reproject({crs:umdProj});
// Calculate pixel area:
var pixelAreaF = ee.Image.pixelArea().reproject({crs:umdProj});
// Multiply pixel count x area: 
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
// This step creates the full natural lands map with global data and MMU applied to natural forest class. 


var blank = ee.Image(1); 

//// NATURAL CLASSES---------------------------------
var natural = blank.where(forest_natmmu.eq(1),2);                           //forests = 2
var natural = natural.where(natural.eq(1).and(shortVeg_natural.eq(1)), 3);   //short veg = 3
var natural = natural.where(natural.eq(1).and(water_natural.eq(1)), 4);     //water = 4 
var natural = natural.where(mangroves.eq(1), 5);                            //mangroves = 5 
var natural = natural.where(natural.eq(1).and(bare_natural.eq(1)), 6);       //bare = 6
var natural = natural.where(natural.eq(1).and(umdSnow.eq(1)), 7);           //snow = 7

//// NON-NATURAL CLASSES-------------------------------
var all = natural.where(natural.eq(1).and(forest_notNatmmu.eq(1)), 14);     //non natural tree cover = 14
var all = all.where(all.eq(1).and(shortVeg_notNatural.eq(1)), 15);           //non natural short veg = 15
var all = all.where(all.eq(1).and(bare_notNatural.eq(1)), 21);               //non natural bare = 21
var all = all.where(globalCoco.eq(1).and(all.eq(6)), 21);                   //non natural bare = 21
var all = all.where(all.eq(1).and(umdVegFraction.eq(1)), 3);                //other natural short veg = 3 (any empty pixels assumed to be natural short veg)
/// re-apply SDPT & GPW where both SDPT/GPW & nat short veg (the filled in pixels)
var all = all.where(sdpt_mask.eq(1).and(all.eq(3)), 15);                    //non natural short veg = 15 (apply SDPT to nat short veg to re-label the filled in pixels)
var all = all.where(cultivated.gt(0).and(all.eq(3)), 15);                  //non natural short veg = 15 (apply cultivated grassland to nat short veg to re-label the filled in pixels)

var all = all.where(umdCrop.eq(1), 12);                                     //cropland = 12
var all = all.where(usgsCrop.eq(1), 12);                                    //cropland = 12
var all = all.where(esaWorldCereal.eq(1), 12);                              //cropland = 12
var all = all.where(umdBuilt.eq(1), 13);                                   //built-up = 13
var all = all.where(mines.eq(1), 13);                                       //built-up = 13

// Overlay wetlands
var all = all.where(all.eq(2).and(umdWetTrees.eq(1)), 8);                   //natural wet trees = 8
var all = all.where(all.eq(3).and(umdWetVeg.eq(1)), 10);                    //natural wet short veg = 10
var all = all.where(all.eq(14).and(umdWetTrees.eq(1)), 17);                 //non natural wet trees = 17
var all = all.where(all.eq(15).and(umdWetVeg.eq(1)), 19);                   //non natural wet short veg = 19

var globalMap = all.updateMask(all.gt(1)).toUint8();
Map.addLayer(globalMap, {min:2, max:21, palette: ["246e24","B9B91E","6BAED6","06A285","fef3cc","ACD1E8","589558","093d09","dbdb7b","99991a","ded485","bd6c5b","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3"]},'globalMap',0);


////////////////////////////////////////////////////////
// MOSAIC LOCAL DATA TOGETHER ///////
///////////////////////////////////////////////////////

//// Add Snow into New Zealand LC-------------------
var nz_lc = nzRemap.where(nzRemap.eq(6).and(globalMap.eq(7)), 7);  // The bare class contains snow/ice, so re-map that to snow/ice


//// Mosaic all local data together------------------
var local = ee.ImageCollection([mapbiomas_sa, nlcd_notNat, mapbiomas_idn, nz_lc, sa_nlc]).mosaic(); 



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
Map.addLayer(naturalLands, {min:2, max:21, palette: ["246e24","B9B91E","6BAED6","06A285","fef3cc","ACD1E8","589558","093d09","dbdb7b","99991a","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3",]}, 'Natural Lands Map',0);

// Natural classes only
var naturalClasses = naturalLands.updateMask(naturalLands.lt(12));
Map.addLayer(naturalClasses,{min:2, max: 11, palette: ["246e24","B9B91E","6BAED6","06A285","fef3cc","ACD1E8","589558","093d09","dbdb7b","99991a"]},'Natural Classes Only',0);

// Non-natural classes only
var notNaturalClasses = naturalLands.updateMask(naturalLands.gt(11));
Map.addLayer(notNaturalClasses,{min:12, max:21, palette:["D3D3D3"]},'Not-Natural Classes Only',0);

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
    assetId:'SBTN/map/'+name, 
    pyramidingPolicy:'sample', 
    region:region, 
    crs:cords['crs'],
    crsTransform: cords['transform'],
    maxPixels:1e13
  })
}

// Example:
//exportImage(allForest_mmu,world,'forest_w_mmu_v1_1')


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
 "D3D3D3",  // Not Natural
 ]
 
var legend_colors = palette;
var legend_keys = ['Forests (2)', 'Wet Forests (8)', 'Peat Forests (9)', ' ', 'Short Vegetation (3)', 'Wet Short Vegetation (10)', 'Peat Short Vegetation (11)','', 'Water (4)', 'Mangroves (5)', 'Bare Ground (6)', 'Snow (7)', 'Not Natural (12-20)']

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

