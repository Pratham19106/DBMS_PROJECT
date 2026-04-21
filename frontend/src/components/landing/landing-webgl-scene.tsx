"use client"

import { type MutableRefObject, useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  EdgesGeometry,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Points,
  PointsMaterial,
  TorusGeometry,
} from "three"

type LandingWebGLSceneProps = {
  progressRef: MutableRefObject<number>
}

function smoothstep(min: number, max: number, value: number): number {
  if (max <= min) return 0
  const x = MathUtils.clamp((value - min) / (max - min), 0, 1)
  return x * x * (3 - 2 * x)
}

function SceneContent({ progressRef }: LandingWebGLSceneProps) {
  const reserveCoreRef = useRef<Mesh | null>(null)
  const reserveCoreMaterialRef = useRef<MeshStandardMaterial | null>(null)
  const coinStackRef = useRef<Group | null>(null)
  const coinStackMaterialRef = useRef<MeshStandardMaterial | null>(null)
  const orbitRingsRef = useRef<Group | null>(null)
  const orbitRingMaterialsRef = useRef<Array<MeshStandardMaterial | null>>([])
  const pointsRef = useRef<Points | null>(null)
  const pointsMaterialRef = useRef<PointsMaterial | null>(null)
  const ledgerBarsRef = useRef<Group | null>(null)
  const ledgerBarsMaterialRef = useRef<MeshStandardMaterial | null>(null)
  const rupeeGlyphRef = useRef<Group | null>(null)
  const rupeeMaterialsRef = useRef<Array<LineBasicMaterial | null>>([])
  const vaultRef = useRef<LineSegments | null>(null)
  const vaultMaterialRef = useRef<LineBasicMaterial | null>(null)
  const smoothedProgress = useRef(0)
  const barMeshes = useRef<Array<Mesh | null>>([])

  const barHeights = useMemo(() => [0.35, 0.62, 0.45, 0.96, 0.58, 1.15, 0.8], [])
  const coinLayers = useMemo(() => Array.from({ length: 8 }, (_, index) => index), [])

  const reserveCoreGeometry = useMemo(() => {
    const geometry = new IcosahedronGeometry(1.02, 6)
    const position = geometry.attributes.position

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i)
      const y = position.getY(i)
      const z = position.getZ(i)

      const radial = 1 + 0.18 * Math.sin(x * 7.1) * Math.cos(y * 6.7) + 0.08 * Math.sin(z * 9.3)
      position.setXYZ(i, x * radial, y * radial, z * radial)
    }

    position.needsUpdate = true
    geometry.computeVertexNormals()
    return geometry
  }, [])

  const coinGeometry = useMemo(() => new CylinderGeometry(0.86, 0.86, 0.08, 48), [])

  const particleGeometry = useMemo(() => {
    const geometry = new BufferGeometry()
    const count = 1800
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i += 1) {
      const radius = 0.35 + Math.random() * 0.95
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(1 - 2 * Math.random())

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      positions[i * 3 + 0] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
    }

    geometry.setAttribute("position", new BufferAttribute(positions, 3))
    return geometry
  }, [])

  const ringGeometries = useMemo(
    () => [
      new TorusGeometry(1.2, 0.03, 12, 120),
      new TorusGeometry(1.55, 0.022, 12, 120),
      new TorusGeometry(1.88, 0.02, 12, 120),
    ],
    []
  )

  const barGeometry = useMemo(() => new BoxGeometry(0.2, 1, 0.2), [])

  const rupeeStrokeGeometries = useMemo(() => {
    const createStroke = (points: Array<[number, number, number]>) => {
      const geometry = new BufferGeometry()
      const segmentPositions: number[] = []

      for (let i = 0; i < points.length - 1; i += 1) {
        segmentPositions.push(...points[i], ...points[i + 1])
      }

      const positions = new Float32Array(segmentPositions)
      geometry.setAttribute("position", new BufferAttribute(positions, 3))
      return geometry
    }

    return [
      createStroke([
        [-0.46, 0.56, 0],
        [0.46, 0.56, 0],
      ]),
      createStroke([
        [-0.44, 0.28, 0],
        [0.28, 0.28, 0],
      ]),
      createStroke([
        [-0.44, 0.56, 0],
        [-0.05, 0.14, 0],
        [0.24, -0.2, 0],
        [0.48, -0.55, 0],
      ]),
    ]
  }, [])

  const rupeeGlyphPlacements = useMemo(
    () => [
      { position: [-0.92, 0.34, 0.22] as [number, number, number], rotation: [0.24, 0.3, 0.08] as [number, number, number], scale: 0.36 },
      { position: [0.8, 0.24, -0.06] as [number, number, number], rotation: [-0.1, -0.34, -0.05] as [number, number, number], scale: 0.31 },
      { position: [0.02, 0.78, 0.28] as [number, number, number], rotation: [0.31, 0.08, 0.03] as [number, number, number], scale: 0.4 },
    ],
    []
  )

  const vaultGeometry = useMemo(() => {
    const box = new BoxGeometry(2.85, 2.85, 2.85, 4, 4, 4)
    return new EdgesGeometry(box)
  }, [])

  useFrame(({ clock, camera }) => {
    smoothedProgress.current = MathUtils.lerp(smoothedProgress.current, progressRef.current, 0.08)
    const p = smoothedProgress.current
    const elapsed = clock.getElapsedTime()

    const reserveWeight = 1 - smoothstep(0.3, 0.62, p)
    const flowWeight = smoothstep(0.28, 0.7, p)
    const vaultWeight = smoothstep(0.64, 0.93, p)
    const rupeeWeight = smoothstep(0.38, 0.9, p)

    if (reserveCoreRef.current) {
      reserveCoreRef.current.rotation.x = elapsed * 0.14 + p * 0.4
      reserveCoreRef.current.rotation.y = elapsed * 0.24 + p * 0.82
      reserveCoreRef.current.rotation.z = elapsed * 0.05

      const reserveScale = 0.93 + reserveWeight * 0.24 + flowWeight * 0.08 - vaultWeight * 0.14
      reserveCoreRef.current.scale.setScalar(reserveScale)
    }

    if (reserveCoreMaterialRef.current) {
      reserveCoreMaterialRef.current.opacity = MathUtils.clamp(0.08 + reserveWeight * 0.9, 0.08, 0.95)
      reserveCoreMaterialRef.current.metalness = 0.62 + reserveWeight * 0.24
      reserveCoreMaterialRef.current.roughness = 0.46 - reserveWeight * 0.22
      reserveCoreMaterialRef.current.emissiveIntensity = 0.05 + flowWeight * 0.22
    }

    if (coinStackRef.current) {
      coinStackRef.current.rotation.y = elapsed * 0.18 + p * 0.28
      coinStackRef.current.position.y = Math.sin(elapsed * 1.3) * 0.02
      const coinScale = 0.82 + reserveWeight * 0.3 + flowWeight * 0.1 - vaultWeight * 0.18
      coinStackRef.current.scale.setScalar(coinScale)
    }

    if (coinStackMaterialRef.current) {
      coinStackMaterialRef.current.opacity = MathUtils.clamp(0.08 + reserveWeight * 0.82 + flowWeight * 0.15, 0.08, 0.95)
      coinStackMaterialRef.current.emissiveIntensity = 0.06 + flowWeight * 0.18
    }

    if (orbitRingsRef.current) {
      orbitRingsRef.current.rotation.x = elapsed * 0.2 + p * 0.4
      orbitRingsRef.current.rotation.y = -elapsed * 0.25 + p * 0.45
      orbitRingsRef.current.rotation.z = elapsed * 0.08
      const ringScale = 0.75 + flowWeight * 0.48 + vaultWeight * 0.14
      orbitRingsRef.current.scale.setScalar(ringScale)
    }

    orbitRingMaterialsRef.current.forEach((material, index) => {
      if (!material) return
      const opacityCap = index === 0 ? 0.86 : index === 1 ? 0.68 : 0.52
      material.opacity = MathUtils.clamp(flowWeight * opacityCap + vaultWeight * 0.06, 0, opacityCap)
    })

    if (pointsRef.current) {
      pointsRef.current.rotation.x = elapsed * 0.12 + p * 0.18
      pointsRef.current.rotation.y = -elapsed * 0.16 + p * 0.36
      pointsRef.current.rotation.z = elapsed * 0.06

      const pointsScale = 0.62 + flowWeight * 0.95 + vaultWeight * 0.18
      pointsRef.current.scale.setScalar(pointsScale)
    }

    if (pointsMaterialRef.current) {
      pointsMaterialRef.current.opacity = MathUtils.clamp(0.02 + flowWeight * 0.8, 0.02, 0.82)
      pointsMaterialRef.current.size = 0.015 + flowWeight * 0.012
    }

    if (ledgerBarsRef.current) {
      ledgerBarsRef.current.rotation.y = elapsed * 0.16 + p * 0.34
      ledgerBarsRef.current.rotation.x = Math.sin(elapsed * 0.45) * 0.04
      ledgerBarsRef.current.position.y = -0.2 + vaultWeight * 0.14
      const barsScale = 0.66 + vaultWeight * 0.44
      ledgerBarsRef.current.scale.setScalar(barsScale)

      barMeshes.current.forEach((mesh, index) => {
        if (!mesh) return
        const target = barHeights[index] ?? 0.5
        const liveHeight = 0.25 + target * (0.5 + 0.5 * Math.sin(elapsed * 1.1 + index * 0.5))
        mesh.scale.y = MathUtils.lerp(mesh.scale.y, 0.25 + liveHeight * (0.2 + vaultWeight * 0.95), 0.09)
        mesh.position.y = mesh.scale.y * 0.5 - 0.25
      })
    }

    if (ledgerBarsMaterialRef.current) {
      ledgerBarsMaterialRef.current.opacity = MathUtils.clamp(vaultWeight * 0.85 + flowWeight * 0.08, 0, 0.9)
    }

    if (rupeeGlyphRef.current) {
      rupeeGlyphRef.current.rotation.y = -elapsed * 0.24 + p * 0.58
      rupeeGlyphRef.current.rotation.x = Math.sin(elapsed * 0.7) * 0.06
      rupeeGlyphRef.current.position.y = 0.08 + flowWeight * 0.18 + Math.sin(elapsed * 1.1) * 0.02
      const rupeeScale = 0.62 + flowWeight * 0.3 + vaultWeight * 0.18
      rupeeGlyphRef.current.scale.setScalar(rupeeScale)
    }

    rupeeMaterialsRef.current.forEach((material, index) => {
      if (!material) return
      const phase = (index % rupeeStrokeGeometries.length) * 0.07
      const shimmer = 0.78 + Math.sin(elapsed * 2.3 + index * 0.37) * 0.18
      material.opacity = MathUtils.clamp((rupeeWeight - phase) * shimmer, 0, 0.92)
    })

    if (vaultRef.current) {
      vaultRef.current.rotation.x = elapsed * 0.1 + p * 0.18
      vaultRef.current.rotation.y = elapsed * 0.15 + p * 0.2
      vaultRef.current.rotation.z = elapsed * 0.05

      const vaultScale = 0.74 + vaultWeight * 0.58
      vaultRef.current.scale.setScalar(vaultScale)
    }

    if (vaultMaterialRef.current) {
      vaultMaterialRef.current.opacity = MathUtils.clamp(vaultWeight * 0.9, 0, 0.9)
    }

    camera.position.z = MathUtils.lerp(camera.position.z, 3.85 - p * 0.4, 0.04)
    camera.position.y = MathUtils.lerp(camera.position.y, 0.06 + p * 0.1, 0.04)
    camera.lookAt(0, 0, 0)
  })

  return (
    <>
      <ambientLight intensity={0.46} />
      <directionalLight position={[2.4, 2, 2]} intensity={1.15} color={new Color("#fff5d8")} />
      <pointLight position={[-2.3, -1.2, 2.2]} intensity={1.1} color={new Color("#ffe199")} />
      <pointLight position={[1.8, -2, -1.4]} intensity={0.8} color={new Color("#8fdcff")} />

      <mesh ref={reserveCoreRef} geometry={reserveCoreGeometry}>
        <meshStandardMaterial
          ref={reserveCoreMaterialRef}
          color={new Color("#1b1f25")}
          emissive={new Color("#8b6a2a")}
          transparent
          opacity={1}
          metalness={0.84}
          roughness={0.25}
        />
      </mesh>

      <group ref={coinStackRef} position={[0, -0.15, 0]}>
        {coinLayers.map((layer) => (
          <mesh key={`coin-layer-${layer}`} geometry={coinGeometry} position={[0, -0.25 + layer * 0.07, 0]}>
            <meshStandardMaterial
              ref={layer === 0 ? coinStackMaterialRef : undefined}
              color={new Color("#d8b05d")}
              emissive={new Color("#8d6322")}
              emissiveIntensity={0.12}
              transparent
              opacity={0.9}
              metalness={0.86}
              roughness={0.28}
            />
          </mesh>
        ))}
      </group>

      <group ref={orbitRingsRef}>
        <mesh geometry={ringGeometries[0]} rotation={[0.2, 0.5, 0]}>
          <meshStandardMaterial
            ref={(element) => {
              orbitRingMaterialsRef.current[0] = element
            }}
            color={new Color("#f7cf83")}
            transparent
            opacity={0}
            emissive={new Color("#9d6f24")}
            emissiveIntensity={0.28}
            metalness={0.75}
            roughness={0.3}
          />
        </mesh>
        <mesh geometry={ringGeometries[1]} rotation={[1.2, -0.2, 0.4]}>
          <meshStandardMaterial
            ref={(element) => {
              orbitRingMaterialsRef.current[1] = element
            }}
            color={new Color("#ffd999")}
            transparent
            opacity={0}
            emissive={new Color("#a9741e")}
            emissiveIntensity={0.24}
            metalness={0.72}
            roughness={0.34}
          />
        </mesh>
        <mesh geometry={ringGeometries[2]} rotation={[-0.7, 0.8, -0.25]}>
          <meshStandardMaterial
            ref={(element) => {
              orbitRingMaterialsRef.current[2] = element
            }}
            color={new Color("#b9e8ff")}
            transparent
            opacity={0}
            emissive={new Color("#3f8dae")}
            emissiveIntensity={0.2}
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
      </group>

      <points ref={pointsRef} geometry={particleGeometry}>
        <pointsMaterial
          ref={pointsMaterialRef}
          color={new Color("#ffe1a8")}
          size={0.02}
          sizeAttenuation
          transparent
          opacity={0.02}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <group ref={ledgerBarsRef} position={[0, -0.35, 0]}>
        {barHeights.map((height, index) => {
          const x = (index - (barHeights.length - 1) / 2) * 0.26
          const z = Math.sin(index * 0.75) * 0.13

          return (
            <mesh
              key={`ledger-bar-${height}-${index}`}
              ref={(element) => {
                barMeshes.current[index] = element
              }}
              geometry={barGeometry}
              position={[x, -0.1, z]}
            >
              <meshStandardMaterial
                ref={index === 0 ? ledgerBarsMaterialRef : undefined}
                color={new Color("#9cdfff")}
                emissive={new Color("#317596")}
                emissiveIntensity={0.2}
                transparent
                opacity={0}
                metalness={0.58}
                roughness={0.42}
              />
            </mesh>
          )
        })}
      </group>

      <group ref={rupeeGlyphRef}>
        {rupeeGlyphPlacements.map((glyph, glyphIndex) => (
          <group
            key={`rupee-glyph-${glyph.position.join("-")}`}
            position={glyph.position}
            rotation={glyph.rotation}
            scale={glyph.scale}
          >
            {rupeeStrokeGeometries.map((geometry, strokeIndex) => {
              const materialIndex = glyphIndex * rupeeStrokeGeometries.length + strokeIndex
              const strokeColor = strokeIndex < 2 ? "#ffd788" : "#9bdfff"

              return (
                <lineSegments key={`rupee-stroke-${strokeIndex}`} geometry={geometry}>
                  <lineBasicMaterial
                    ref={(element) => {
                      rupeeMaterialsRef.current[materialIndex] = element
                    }}
                    color={new Color(strokeColor)}
                    transparent
                    opacity={0}
                  />
                </lineSegments>
              )
            })}
          </group>
        ))}
      </group>

      <lineSegments ref={vaultRef} geometry={vaultGeometry}>
        <lineBasicMaterial
          ref={vaultMaterialRef}
          color={new Color("#cbecff")}
          transparent
          opacity={0}
        />
      </lineSegments>
    </>
  )
}

export function LandingWebGLScene({ progressRef }: LandingWebGLSceneProps) {
  return (
    <div className="h-full w-full">
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 0.1, 3.8], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <SceneContent progressRef={progressRef} />
      </Canvas>
    </div>
  )
}
