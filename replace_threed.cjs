const fs = require('fs');
const path = 'src/components/ThreeDView.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldStr = `      // Ties
      data.ties.forEach(tie => {
        // Create a rectangular path for the tie
        const shape = new THREE.Shape();
        const w = tie.length / 2;
        const h = tie.width / 2;
        shape.moveTo(-w, -h);
        shape.lineTo(w, -h);
        shape.lineTo(w, h);
        shape.lineTo(-w, h);
        shape.lineTo(-w, -h);

        const extrudeSettings = {
          steps: 1,
          depth: tBar.diameter,
          bevelEnabled: false,
        };
        
        // Simplified tie as a torus-like structure or 4 cylinders
        const tieGroup = new THREE.Group();
        const mat = new THREE.MeshPhongMaterial({ color: 0x1e40af });
        
        const createSide = (len: number, x: number, z: number, rotY: number) => {
          const geom = new THREE.CylinderGeometry(tBar.diameter / 2, tBar.diameter / 2, len, 8);
          const mesh = new THREE.Mesh(geom, mat);
          mesh.position.set(x, tie.z, z);
          mesh.rotation.z = Math.PI / 2;
          mesh.rotation.y = rotY;
          tieGroup.add(mesh);
        };

        createSide(tie.length, 0, tie.width / 2, 0);
        createSide(tie.length, 0, -tie.width / 2, 0);
        createSide(tie.width, tie.length / 2, 0, Math.PI / 2);
        createSide(tie.width, -tie.length / 2, 0, Math.PI / 2);
        
        scene.add(tieGroup);
      });`;

const newStr = `      // Ties
      data.ties.forEach(tie => {
        const tieGroup = new THREE.Group();
        const mat = new THREE.MeshPhongMaterial({ color: 0x1e40af });
        
        const createSide = (len: number, x: number, z: number, rotY: number) => {
          const geom = new THREE.CylinderGeometry(tBar.diameter / 2, tBar.diameter / 2, len, 8);
          const mesh = new THREE.Mesh(geom, mat);
          mesh.position.set(x, tie.z, z);
          mesh.rotation.z = Math.PI / 2;
          mesh.rotation.y = rotY;
          tieGroup.add(mesh);
        };

        if (tie.type === 'outer') {
          createSide(tie.length!, 0, tie.width! / 2, 0);
          createSide(tie.length!, 0, -tie.width! / 2, 0);
          createSide(tie.width!, tie.length! / 2, 0, Math.PI / 2);
          createSide(tie.width!, -tie.length! / 2, 0, Math.PI / 2);
        } else if (tie.type === 'crosstie_x') {
          const len = tie.endX! - tie.startX!;
          const x = (tie.startX! + tie.endX!) / 2;
          createSide(len, x, tie.y!, 0);
        } else if (tie.type === 'crosstie_y') {
          const len = tie.endY! - tie.startY!;
          const z = (tie.startY! + tie.endY!) / 2;
          createSide(len, tie.x!, z, Math.PI / 2);
        }
        
        scene.add(tieGroup);
      });`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content);
