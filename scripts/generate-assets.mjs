import fs from 'fs';
import path from 'path';

class PolyfillFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
}
globalThis.FileReader = PolyfillFileReader;

async function run() {
  const THREE = await import('three');
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  const outDir = path.resolve('public/models');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const exporter = new GLTFExporter();
  function exportGLB(object, filename) {
    return new Promise((resolve, reject) => {
      exporter.parse(
        object,
        (glb) => {
          const filePath = path.join(outDir, filename);
          fs.writeFileSync(filePath, Buffer.from(glb));
          console.log(`Saved ${filename} (${glb.byteLength} bytes)`);
          resolve();
        },
        (err) => reject(err),
        { binary: true }
      );
    });
  }

  // 1. Model: Mây (May.glb)
  {
    const mayGroup = new THREE.Group();
    mayGroup.name = 'May';

    // Body: Tunic (Áo Bà Ba / Ngũ thân)
    const tunicGeo = new THREE.CylinderGeometry(0.38, 0.52, 1.15, 16);
    const tunicMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.7 });
    const tunic = new THREE.Mesh(tunicGeo, tunicMat);
    tunic.position.y = 0.78;
    mayGroup.add(tunic);

    // Collar detail
    const collarGeo = new THREE.TorusGeometry(0.38, 0.05, 8, 16);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0xd4cdb8, roughness: 0.6 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 1.35;
    mayGroup.add(collar);

    // Silk Sash (Dải lụa đỏ)
    const sashGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.22, 16);
    const sashMat = new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.5 });
    const sash = new THREE.Mesh(sashGeo, sashMat);
    sash.position.y = 0.78;
    mayGroup.add(sash);

    // Sash Knot & Ribbon
    const knotGeo = new THREE.BoxGeometry(0.12, 0.15, 0.1);
    const ribbonGeo = new THREE.BoxGeometry(0.08, 0.45, 0.02);
    const knot = new THREE.Mesh(knotGeo, sashMat);
    knot.position.set(0, 0.78, 0.45);
    const ribbon = new THREE.Mesh(ribbonGeo, sashMat);
    ribbon.position.set(0.04, 0.55, 0.45);
    ribbon.rotation.z = -0.15;
    mayGroup.add(knot, ribbon);

    // Head
    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa, roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.5;
    mayGroup.add(head);

    // Hair & Topknot (Búi tóc)
    const hairGeo = new THREE.SphereGeometry(0.36, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f1b24, roughness: 0.8 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.52;
    const bunGeo = new THREE.SphereGeometry(0.14, 12, 12);
    const bun = new THREE.Mesh(bunGeo, hairMat);
    bun.position.set(0, 1.85, -0.15);
    mayGroup.add(hair, bun);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.12, 1.52, 0.32);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.12, 1.52, 0.32);
    mayGroup.add(lEye, rEye);

    // Cute Cheeks
    const cheekGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const cheekMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.6 });
    const lCheek = new THREE.Mesh(cheekGeo, cheekMat);
    lCheek.position.set(-0.2, 1.45, 0.28);
    const rCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rCheek.position.set(0.2, 1.45, 0.28);
    mayGroup.add(lCheek, rCheek);

    // Nón Lá (Conical Palm Hat) with bamboo trim
    const hatGeo = new THREE.ConeGeometry(0.95, 0.48, 32);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xd9c59a, roughness: 0.85 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 1.84;
    const brimGeo = new THREE.TorusGeometry(0.95, 0.03, 8, 32);
    const brimMat = new THREE.MeshStandardMaterial({ color: 0x8c734b, roughness: 0.7 });
    const brim = new THREE.Mesh(brimGeo, brimMat);
    brim.rotation.x = Math.PI / 2;
    brim.position.y = 1.6;
    mayGroup.add(hat, brim);

    // Handheld Lantern Staff (Cán đèn & Đèn lồng nhỏ)
    const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.1, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.7 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0.48, 1.15, 0.2);
    pole.rotation.x = 0.2;
    mayGroup.add(pole);

    const miniLanternGroup = new THREE.Group();
    miniLanternGroup.name = 'MiniLantern';
    miniLanternGroup.position.set(0.48, 1.45, 0.35);
    const miniSilkGeo = new THREE.OctahedronGeometry(0.16, 0);
    const miniSilkMat = new THREE.MeshStandardMaterial({
      color: 0xffe9b0,
      emissive: 0xffb347,
      emissiveIntensity: 0.95,
      roughness: 0.3
    });
    const miniSilk = new THREE.Mesh(miniSilkGeo, miniSilkMat);
    const tasselGeo = new THREE.CylinderGeometry(0.015, 0.035, 0.18, 6);
    const tasselMat = new THREE.MeshStandardMaterial({ color: 0xc8102e });
    const tassel = new THREE.Mesh(tasselGeo, tasselMat);
    tassel.position.y = -0.22;
    miniLanternGroup.add(miniSilk, tassel);
    mayGroup.add(miniLanternGroup);

    // Legs and Wooden Sandals (Guốc mộc)
    const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.45, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
    const lLeg = new THREE.Mesh(legGeo, legMat);
    lLeg.position.set(-0.16, 0.25, 0);
    const rLeg = new THREE.Mesh(legGeo, legMat);
    rLeg.position.set(0.16, 0.25, 0);
    const sandalGeo = new THREE.BoxGeometry(0.14, 0.06, 0.26);
    const sandalMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
    const lSandal = new THREE.Mesh(sandalGeo, sandalMat);
    lSandal.position.set(-0.16, 0.03, 0.03);
    const rSandal = new THREE.Mesh(sandalGeo, sandalMat);
    rSandal.position.set(0.16, 0.03, 0.03);
    mayGroup.add(lLeg, rLeg, lSandal, rSandal);

    await exportGLB(mayGroup, 'May.glb');
  }

  // 2. Model: Pagoda Lantern (PagodaLantern.glb)
  {
    const pagodaGroup = new THREE.Group();
    pagodaGroup.name = 'PagodaLantern';

    // Tier 1: Carved Stone Base
    const plinthGeo = new THREE.CylinderGeometry(1.6, 1.85, 0.4, 8);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5b6070, roughness: 0.9 });
    const plinth = new THREE.Mesh(plinthGeo, stoneMat);
    plinth.position.y = 0.2;
    pagodaGroup.add(plinth);

    const lotusGeo = new THREE.CylinderGeometry(1.3, 1.55, 0.3, 8);
    const lotus = new THREE.Mesh(lotusGeo, stoneMat);
    lotus.position.y = 0.55;
    pagodaGroup.add(lotus);

    // Tier 2: 4 Ornate Wooden Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.65 });
    const pillarGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.9, 8);
    [
      [-0.55, -0.55],
      [0.55, -0.55],
      [-0.55, 0.55],
      [0.55, 0.55]
    ].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 1.7, pz);
      pagodaGroup.add(pillar);
    });

    // Tier 3: Translucent Silk Lantern Chamber
    const silkGeo = new THREE.CylinderGeometry(0.68, 0.68, 1.8, 16);
    const silkMat = new THREE.MeshStandardMaterial({
      color: 0xffb347,
      emissive: 0xffb347,
      emissiveIntensity: 0.4,
      roughness: 0.35
    });
    const silkChamber = new THREE.Mesh(silkGeo, silkMat);
    silkChamber.name = 'SilkChamber';
    silkChamber.position.y = 1.7;
    pagodaGroup.add(silkChamber);

    // Tier 4: Double-Tiered Pagoda Roof (Mái đình ngói mũi hài)
    const lowerRoofGeo = new THREE.ConeGeometry(2.1, 0.6, 8);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.6 });
    const lowerRoof = new THREE.Mesh(lowerRoofGeo, roofMat);
    lowerRoof.position.y = 2.85;
    pagodaGroup.add(lowerRoof);

    const midPlinthGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.25, 8);
    const midPlinth = new THREE.Mesh(midPlinthGeo, pillarMat);
    midPlinth.position.y = 3.25;
    pagodaGroup.add(midPlinth);

    const upperRoofGeo = new THREE.ConeGeometry(1.5, 0.55, 8);
    const upperRoof = new THREE.Mesh(upperRoofGeo, roofMat);
    upperRoof.position.y = 3.6;
    pagodaGroup.add(upperRoof);

    // Spire Finial (Hồ lô đỉnh nóc)
    const spireGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xb45309,
      emissiveIntensity: 0.3
    });
    const spire = new THREE.Mesh(spireGeo, goldMat);
    spire.position.y = 4.0;
    pagodaGroup.add(spire);

    await exportGLB(pagodaGroup, 'PagodaLantern.glb');
  }

  // 3. Model: Ink Shade (InkShade.glb)
  {
    const shadeGroup = new THREE.Group();
    shadeGroup.name = 'InkShade';

    // Body: Shifting Ink Blob
    const blobGeo = new THREE.SphereGeometry(0.75, 16, 16);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0x09050d,
      roughness: 0.9,
      emissive: 0x581c87,
      emissiveIntensity: 0.6
    });
    const blob = new THREE.Mesh(blobGeo, shadeMat);
    blob.name = 'ShadeBody';
    blob.position.y = 0.85;
    shadeGroup.add(blob);

    // Crown Hornlets
    const hornGeo = new THREE.ConeGeometry(0.12, 0.45, 6);
    const lHorn = new THREE.Mesh(hornGeo, shadeMat);
    lHorn.position.set(-0.35, 1.6, 0.05);
    lHorn.rotation.z = 0.3;
    const rHorn = new THREE.Mesh(hornGeo, shadeMat);
    rHorn.position.set(0.35, 1.6, 0.05);
    rHorn.rotation.z = -0.3;
    shadeGroup.add(lHorn, rHorn);

    // Glowing Eyes
    const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.name = 'LeftEye';
    lEye.position.set(-0.25, 0.95, 0.6);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.name = 'RightEye';
    rEye.position.set(0.25, 0.95, 0.6);
    shadeGroup.add(lEye, rEye);

    // Undulating Tentacles
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      const tentGeo = new THREE.CylinderGeometry(0.08, 0.02, 0.7, 6);
      const tent = new THREE.Mesh(tentGeo, shadeMat);
      tent.position.set(Math.cos(a) * 0.45, 0.3, Math.sin(a) * 0.45);
      tent.rotation.x = Math.sin(a) * 0.3;
      tent.rotation.z = -Math.cos(a) * 0.3;
      shadeGroup.add(tent);
    }

    await exportGLB(shadeGroup, 'InkShade.glb');
  }

  // 4. Model: Island Scenery (Scenery.glb)
  {
    const sceneGroup = new THREE.Group();
    sceneGroup.name = 'Scenery';

    // Bamboo Stalks
    const bambooMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.6 });
    for (let i = 0; i < 5; i++) {
      const stalkGeo = new THREE.CylinderGeometry(0.08, 0.1, 4.0 + i * 0.5, 8);
      const stalk = new THREE.Mesh(stalkGeo, bambooMat);
      stalk.position.set((i - 2) * 0.6, 2.0, (i % 2) * 0.4);
      sceneGroup.add(stalk);
    }

    // Ancient Stone Gate (Cổng làng)
    const gateStoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    const postGeo = new THREE.BoxGeometry(0.45, 3.2, 0.45);
    const lPost = new THREE.Mesh(postGeo, gateStoneMat);
    lPost.position.set(-2.0, 1.6, 0);
    const rPost = new THREE.Mesh(postGeo, gateStoneMat);
    rPost.position.set(2.0, 1.6, 0);

    const beamGeo = new THREE.BoxGeometry(4.8, 0.4, 0.6);
    const beam = new THREE.Mesh(beamGeo, gateStoneMat);
    beam.position.set(0, 3.2, 0);

    const roofGeo = new THREE.BoxGeometry(5.2, 0.25, 1.0);
    const gateRoofMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.6 });
    const gateRoof = new THREE.Mesh(roofGeo, gateRoofMat);
    gateRoof.position.set(0, 3.5, 0);

    sceneGroup.add(lPost, rPost, beam, gateRoof);

    await exportGLB(sceneGroup, 'Scenery.glb');
  }

  console.log('All 4 GLB 3D models generated and verified!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
