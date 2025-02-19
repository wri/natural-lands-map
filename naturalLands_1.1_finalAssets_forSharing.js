/*  
Script for using the SBTN Natural Lands Map 

Mazur, E., Sims, M., et al. (2025) SBTN Natural Lands Map v1.1
World Resources Institute, World Wildlife Fund, Systemiq, Science Basted Targets Network 

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

var naturalLands = ee.Image('WRI/SBTN/naturalLands/v1_1/2020')

Map.addLayer(naturalLands.select('classification'), {min:2, max:21, palette: ["246e24","B9B91E","6BAED6","06A285","fef3cc","ACD1E8","589558","093d09","dbdb7b","99991a","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3","D3D3D3",]}, 'Classification');
Map.addLayer(naturalLands.select('natural'), {min:0,max:1,palette:['969696','a8ddb5']}, 'Natural');


