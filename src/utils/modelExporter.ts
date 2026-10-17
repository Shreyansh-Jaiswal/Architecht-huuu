import * as THREE from 'three';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { ArchitectureModelData } from '../types/architect.ts';

export function exportSceneToOBJ(sceneOrGroup: THREE.Object3D, filename: string = 'architectural_model.obj'): void {
  const exporter = new OBJExporter();
  const result = exporter.parse(sceneOrGroup);
  
  const blob = new Blob([result], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportSpecificationsJSON(data: ArchitectureModelData, filename: string = 'building_specs.json'): void {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
