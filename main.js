import "@kitware/vtk.js/Rendering/Profiles/Geometry";
import './style.css';

import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkGlyph3DMapper from '@kitware/vtk.js/Rendering/Core/Glyph3DMapper';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkPolyDataNormals from '@kitware/vtk.js/Filters/Core/PolyDataNormals';

const container = document.getElementById("container");
const loading = document.getElementById("loading");
const { clientWidth, clientHeight } = container;
const renderWindow = vtkRenderWindow.newInstance();
const renderer = vtkRenderer.newInstance();
const glWindow = vtkOpenGLRenderWindow.newInstance();
renderWindow.addRenderer(renderer);
renderWindow.addView(glWindow);

renderer.setBackground(0.02,0.02,0.02); 

glWindow.setContainer(container);
glWindow.setSize(clientWidth, clientHeight);
glWindow.initialize();

let wireframeActor, hullActor, sphereActor;
let loadedWireframe, loadedHull, loadedPoints;

function tryInit() {
  if (loadedHull && loadedPoints && loadedWireframe) {
    renderer.resetCamera();
    renderer.getActiveCamera().zoom(1.5);
    const camera = renderer.getActiveCamera();
    const currentRange = camera.getClippingRange(); 
    camera.setClippingRange(0.001, currentRange[1] + 100);
    loading.classList.add("hidden");
    animate();
  };
};

const wireframeReader = vtkXMLPolyDataReader.newInstance();
wireframeReader.setUrl("models/brain_edges.vtp").then(() => {
    wireframeReader.update();

    const wireframeMapper = vtkMapper.newInstance();
    wireframeMapper.setInputConnection(wireframeReader.getOutputPort());

    wireframeMapper.getViewSpecificProperties().OpenGL = {
        ShaderReplacements: [
            {
                shaderType: 'Fragment',
                originalValue: '//VTK::Color::Impl',
                replaceFirst: true,
                replacementValue: `
                    //VTK::Color::Impl
                    opacity = 0.05;
                `,
            }
        ]
    };

    wireframeActor = vtkActor.newInstance();
    wireframeActor.setMapper(wireframeMapper);

    wireframeActor.getProperty().setRepresentationToWireframe();
    wireframeActor.getProperty().setRepresentation(1);

    wireframeActor.getProperty().setOpacity(1.0); 
    wireframeActor.getProperty().setColor(0.020, 0.835, 0.886);
    
    wireframeActor.getProperty().setLighting(false);

    wireframeActor.getProperty().setBackfaceCulling(true)
    
    wireframeActor.setOrigin(-0.7230189442634583, 1.5103785395622253, 0.8213195204734802);
    wireframeActor.setOrientation(0, 90, 0);
    
    renderer.addActor(wireframeActor);
    loadedWireframe = true;
    tryInit();
});

const hullReader = vtkOBJReader.newInstance();
hullReader.setUrl("models/brain.obj").then(() => {
    hullReader.update();

    const hullMapper = vtkMapper.newInstance();
    hullMapper.setInputConnection(hullReader.getOutputPort());
    hullMapper.setResolveCoincidentTopologyPolygonOffsetParameters(1, 1);

    hullMapper.getViewSpecificProperties().OpenGL = {
        ShaderReplacements: [
            {
                shaderType: 'Fragment',
                originalValue: '//VTK::Color::Impl',
                replaceFirst: true,
                replacementValue: `
                    //VTK::Color::Impl
                    opacity = opacityUniform;
                `,
            },
        ]
    };

    hullActor = vtkActor.newInstance();
    hullActor.setMapper(hullMapper);
    hullActor.getProperty().setColor(0.020, 0.835, 0.886);
    hullActor.getProperty().setOpacity(0.075);
    hullActor.getProperty().setLighting(false);
    hullActor.getProperty().setBackfaceCulling(false);
    hullActor.setOrigin(-0.7230189442634583, 1.5103785395622253, 0.8213195204734802);
    hullActor.setOrientation(0, 90, 0);

    renderer.addActor(hullActor);
    loadedHull = true;
    tryInit();
});

const edgesReader = vtkOBJReader.newInstance();
edgesReader.setUrl("models/brain.obj").then(() => {
    edgesReader.update();

    const sphereSrc = vtkSphereSource.newInstance();
    sphereSrc.setRadius(0.002); 

    const glyph = vtkGlyph3DMapper.newInstance();
    glyph.setInputConnection(edgesReader.getOutputPort());
    glyph.setSourceConnection(sphereSrc.getOutputPort());

    sphereActor = vtkActor.newInstance();
    sphereActor.setMapper(glyph);

    sphereActor.getProperty().setColor(0.020, 0.835, 0.886);
    sphereActor.getProperty().setOpacity(0.99); 
    sphereActor.getProperty().setRepresentation(0);

    sphereActor.setOrigin(-0.7230189442634583, 1.5103785395622253, 0.8213195204734802);
    sphereActor.setOrientation(0, 90, 0);

    renderer.addActor(sphereActor);
    loadedPoints = true;
    tryInit();
});

window.addEventListener("resize", () => {
  const { clientWidth, clientHeight } = container;
  glWindow.setSize(clientWidth, clientHeight);
  renderWindow.render();
});

function animate() {
  requestAnimationFrame(animate);

  wireframeActor.rotateY(0.15);
  hullActor.rotateY(0.15);
  sphereActor.rotateY(0.15);
  
  renderWindow.render();
}