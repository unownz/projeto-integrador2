window.onload = init;

function init() {
    var map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            })
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([-45.4119, -23.6225]),
            zoom: 15
        })
    })

    // Vector Layers
    const fillStyle = new ol.style.Fill({
        color: [255,0,0,1]
    })

    const strokeStyle = new ol.style.Stroke({
        color: [0,0,0,0],
        width: 1
    })

    const circleStyle = new ol.style.Circle({
        fill: new ol.style.Fill({
            color: 'blue'
        }),
        radius: 10,
    })

    const postosGeoJSON = new ol.layer.VectorImage({
        source: new ol.source.Vector({
            url: '/data/vector_data/postos.geojson',
            format: new ol.format.GeoJSON()
        }),
        visible: true,
        title: 'postosGeoJSON',
        style: new ol.style.Style({
            fill: fillStyle,
            stroke: strokeStyle,
            image: circleStyle
        })
    })
    map.addLayer(postosGeoJSON)

    // Vector Feature Popup Logic
    const overlayContainerElement = document.querySelector('.overlay-container')
    const overlayLayer = new ol.Overlay({
        element: overlayContainerElement
    })
    map.addOverlay(overlayLayer)
    const overlayFeatureName = document.getElementById('feature-name')

    map.on('click', function(e){
        overlayLayer.setPosition(undefined)
        map.forEachFeatureAtPixel(e.pixel, function(feature, layer){
            let clickedCoordinate = e.coordinate
            let clickedFeatureName = feature.get('name')
            overlayLayer.setPosition(clickedCoordinate)
            overlayFeatureName.innerHTML = clickedFeatureName
        },
        {
            layerFilter: function(layerCandidate) {
                return layerCandidate.get('title') === 'postosGeoJSON'
            }
        })
    })
}