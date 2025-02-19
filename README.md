## Natural Lands Map 

*Version 1.1*

This map was created by World Resources Institute’s Land and Carbon Lab in collaboration with WWF and Systemiq for the Science Based Target Network's [Land Targets](https://sciencebasedtargetsnetwork.org/how-it-works/set-targets/). The map is intended to be used by companies as a 2020 baseline for setting Target 1: “No conversion of natural ecosystems”. 

Full technical documentation for the Natural Lands Map is available [at this link](https://sciencebasedtargetsnetwork.org/wp-content/uploads/2025/02/Technical-Guidance-2025-Step3-Land-v1_1-Natural-Lands-Map.pdf). 

The Natural Lands Map was created in [Google Earth Engine](https://earthengine.google.com/) (GEE). This repository contains the script for creating the full Natural Lands Map and pre-processing scripts for some input datasets. Input datasets that were not already available in GEE as a public asset were ingested in their original data format, and all subsequent processing steps are included in the code. The exception is the Spatial Database of Planted Trees, version 2, which was rasterized at 30m resolution from vector format via the GFW Data API.  

The Natural Lands Map will be updated as improved input data become available.  

![Natural Lands Map](binary.png)

### Citation 

Mazur, E., M. Sims, E. Goldman, M. Schneider, M.D. Pirri, C.R. Beatty, F. Stolle, Stevenson, M. 2025. “SBTN Natural Lands Map v1.1: Technical Documentation”. *Science Based Targets for Land Version 1-- Supplementary Material*. Science Based Targets Network. https://sciencebasedtargetsnetwork.org/wp-content/uploads/2025/02/Technical-Guidance-2025-Step3-Land-v1_1-Natural-Lands-Map.pdf

### GEE application 

The map can be viewed online via a Google Earth Engine Application [here](https://wri-datalab.earthengine.app/view/sbtn-natural-lands).  

### Data Access

The map can be accessed on GEE [at this link](https://developers.google.com/earth-engine/datasets/catalog/WRI_SBTN_naturalLands_v1_1_2020). 

GeoTiffs are available as 10x10 degree tiles and can be downloaded from [lcl_public/SBTN_NaturalLands/v1_1](https://console.cloud.google.com/storage/browser/lcl_public/SBTN_NaturalLands/v1_1).

Class values can be found [here](https://docs.google.com/spreadsheets/d/13w0Ezo5OMTInsBOn6OrBN-G580YqVvIWhsxgyeK3GuY/edit?usp=sharing). 

The SBTN Natural Lands Map has a [Creative Commons Attribution ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/deed.en). Companies may use this map for target setting. 


### Contact 

Elise Mazur: elise.mazur@wri.org 

Michelle Sims: michelle.sims@wri.org 
