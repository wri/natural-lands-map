/*  
Script for using the SBTN Natural Lands Map 

Mazur, E., Sims, M., et al. (2024) SBTN Natural Lands Map
World Resources Institute, World Wildlife Fund, Systemiq, Science Basted Targets Network 
Full methodology in the technical note here: https://sciencebasedtargetsnetwork.org/wp-content/uploads/2024/09/Technical-Guidance-2024-Step3-Land-v1-Natural-Lands-Map.pdf


There are 2 bands included in this asset: 
1. 'natural'
Binary values: 0 = non-natural, 1 = natural


2. 'classification': this band has all the natural & non-natural land cover classes 
classification values: 
Natural:     2 = natural forests, 3 = natural short vegetation, 4 = natural water, 5 = mangroves, 
             6 = bare, 7 = snow, 8 = wet natural forests, 9 = natural peat forests, 
             10 = wet natural short vegetation, 11 = natural peat short vegetation 
Non-Natural: 12 = cropland, 13 = built, 14 = non-natural tree cover, 15 = non-natural short vegetation,
             16 = non-natural water, 17 = wet non-natural forests, 18 = non-natural peat forests,
             19 = wet non-natural short vegetation, 20 = non-natural peat short vegetation,
             21 = bare. 

*/

var naturalLands = ee.Image('WRI/SBTN/naturalLands/v1/2020');

Map.addLayer(naturalLands.select('classification'), {}, 'Classification');
Map.addLayer(naturalLands.select('natural'), {}, 'Natural');
