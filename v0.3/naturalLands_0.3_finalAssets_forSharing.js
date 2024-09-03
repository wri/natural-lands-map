/* 
Script for using the SBTN Natural Lands Map 

Mazur, E. et al. (2023) SBTN Natural Lands Map
World Resources Institute, World Wildlife Fund, Systemiq, Science Basted Targets Network 
https://sciencebasedtargetsnetwork.org/wp-content/uploads/2023/05/Technical-Guidance-2023-Step3-Land-v0.3-Natural-Lands-Map.pdf


There are 3 layers included in this script: 
1. Natural Lands Binary: this image has 2 values - natural, and non-natural 
Binary values: 1 = natural, 2 = non-natural


2. Natural Lands Classes: this image has all the natural land cover classes 
    and non-natural land cover classes
All Classes values: 
Natural:     2 = natural forests, 3 = natural short vegetation, 4 = natural water, 5 = mangroves, 
             6 = bare, 7 = snow, 8 = wet natural forests, 9 = natural peat forests, 
             10 = wet natural short vegetation, 11 = natural peat short vegetation 
Non-Natural: 12 = cropland, 13 = built, 14 = non-natural tree cover, 15 = non-natural short vegetation,
             16 = non-natural water, 17 = wet non-natural forests, 18 = non-natural peat forests,
             19 = wet non-natural short vegetation, 20 = non-natural peat short vegetation. 


3. Core Natural Lands: this image has 3 values - core natural lands, other natural lands, 
    and non-natural lands
Core values: 1 = non-natural, 2 = core natural lands, 3 = other natural lands

*/


var binary = ee.Image('projects/wri-datalab/SBTN/natLands_beta/naturalLands_binary_20230516')
var allClasses = ee.Image('projects/wri-datalab/SBTN/natLands_beta/naturalLands_allClasses_20230516')
var core = ee.Image('projects/wri-datalab/SBTN/natLands_beta/naturalLands_core_20230516')


Map.addLayer(binary, {min:1,max:2,palette:['a8ddb5','969696']},'Nautral Lands - Binary',1,1);
Map.addLayer(allClasses,{min:2,max:20,palette:["246e24","B9B91E","6BAED6","06A285","fef3cc","ACD1E8","589558","093d09","dbdb7b","99991a","D3D3D3","D3D3D4","D3D3D5","D3D3D6","D3D3D7","D3D3D8","D3D3D9","D3D3D1","D3D3D2"]},'Natural Lands - All Classes',0)
Map.addLayer(core, {min:1,max:3,palette:['D3D3D3','2b6639','a8ddb5']},'Core Natural Lands',0,1);
