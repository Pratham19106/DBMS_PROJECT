"use client"

import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { BarChart3, CreditCard, Boxes } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

export function Landing3DCards() {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const cards = Array.from(root.querySelectorAll<HTMLElement>(".landing-card-3d"))

    const ctx = gsap.context(() => {
      gsap.set(cards, {
        x: (index) => index * 12,
        y: (index) => index * 16,
        z: (index) => -index * 90,
        scale: (index) => 1 - index * 0.04,
        rotateX: (index) => -6 + index * 2,
        rotateY: (index) => (index % 2 === 0 ? 8 : -8),
        zIndex: (index) => 30 - index * 10,
        transformPerspective: 1200,
        transformOrigin: "center center",
      })

      const popTl = gsap.timeline({
        defaults: { duration: 1.05, ease: "power2.inOut" },
        repeat: -1,
        repeatDelay: 0.15,
      })

      popTl
        .to(cards[0], { x: -8, y: -28, z: 150, scale: 1.04, rotateY: 8, zIndex: 40 }, 0)
        .to(cards[1], { x: 12, y: 10, z: 20, scale: 0.98, rotateY: -10, zIndex: 25 }, 0)
        .to(cards[2], { x: 26, y: 30, z: -70, scale: 0.92, rotateY: 12, zIndex: 10 }, 0)
        .to(cards[0], { x: -12, y: 10, z: 10, scale: 0.97, rotateY: 10, zIndex: 20 }, ">")
        .to(cards[1], { x: -2, y: -30, z: 150, scale: 1.04, rotateY: -8, zIndex: 40 }, "<")
        .to(cards[2], { x: 22, y: 26, z: -60, scale: 0.92, rotateY: 10, zIndex: 10 }, "<")
        .to(cards[0], { x: -14, y: 26, z: -60, scale: 0.92, rotateY: 12, zIndex: 10 }, ">")
        .to(cards[1], { x: 6, y: 8, z: 20, scale: 0.98, rotateY: -10, zIndex: 22 }, "<")
        .to(cards[2], { x: -2, y: -30, z: 150, scale: 1.04, rotateY: 8, zIndex: 40 }, "<")

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 85%",
          end: "bottom top",
          scrub: 1,
        },
      })

      scrollTl.fromTo(root, { y: 16, scale: 0.96 }, { y: -20, scale: 1.02, ease: "none" }, 0)
    }, root)

    const onPointerMove = (event: PointerEvent) => {
      const bounds = root.getBoundingClientRect()
      const x = (event.clientX - bounds.left) / bounds.width
      const y = (event.clientY - bounds.top) / bounds.height

      const rotateY = (x - 0.5) * 18
      const rotateX = (0.5 - y) * 16

      gsap.to(root, {
        rotateX,
        rotateY,
        duration: 0.35,
        ease: "power2.out",
      })
    }

    const onPointerLeave = () => {
      gsap.to(root, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.45,
        ease: "power2.out",
      })
    }

    root.addEventListener("pointermove", onPointerMove)
    root.addEventListener("pointerleave", onPointerLeave)

    return () => {
      root.removeEventListener("pointermove", onPointerMove)
      root.removeEventListener("pointerleave", onPointerLeave)
      ctx.revert()
    }
  }, [])

  return (
    <div className="landing-perspective h-full w-full">
      <div ref={rootRef} className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
        <div className="landing-card-3d absolute inset-x-4 top-4 bottom-14 rounded-3xl border border-primary/30 bg-card/90 p-5 backdrop-blur md:inset-x-6 md:top-6 md:bottom-16">
          <div className="mb-3 inline-flex rounded-xl bg-primary/20 p-2 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Live Metrics</p>
          <h4 className="mt-1 text-xl font-semibold text-card-foreground">Debt Radar</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            Visibility across outstanding balances, due urgency, and payment risk.
          </p>
        </div>

        <div className="landing-card-3d absolute inset-x-8 top-10 bottom-9 rounded-3xl border border-chart-2/35 bg-card/85 p-5 backdrop-blur md:inset-x-12 md:top-12 md:bottom-10">
          <div className="mb-3 inline-flex rounded-xl bg-chart-2/20 p-2 text-chart-2">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">AI Payment Strategy</p>
          <h4 className="mt-1 text-xl font-semibold text-card-foreground">Priority Queue</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            Recommended pay order based on tolerance, pending amount, and waiting days.
          </p>
        </div>

        <div className="landing-card-3d absolute inset-x-12 top-16 bottom-4 rounded-3xl border border-chart-1/35 bg-card/80 p-5 backdrop-blur md:inset-x-18 md:top-20 md:bottom-14">
          <div className="mb-3 inline-flex rounded-xl bg-chart-1/20 p-2 text-chart-1">
            <Boxes className="h-5 w-5" />
          </div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Inventory Pulse</p>
          <h4 className="mt-1 text-xl font-semibold text-card-foreground">Stock Signals</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            Daily shortages and smart replenishment pathways tuned to vendor relationships.
          </p>
        </div>
      </div>
    </div>
  )
}
