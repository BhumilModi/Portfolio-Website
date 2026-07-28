import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Brutalist button variants ported from the design file. The shadcn defaults
 * were removed outright — every one of them is rounded and soft and nothing in
 * this design uses them. Zero border-radius, hard offset shadows, exact
 * paddings and type sizes from the source.
 *
 * `display` lives on each variant, not the base, so `brutalCard`'s `grid`
 * cannot lose a same-layer coin-flip against an `inline-flex` base.
 *
 * The design has no focus indicator at all; the port adds a visible orange
 * focus-visible ring to every variant. That is the one deliberate addition.
 */
const buttonVariants = cva(
  "shrink-0 cursor-pointer rounded-none whitespace-nowrap outline-none transition-[transform,box-shadow,background-color,border-color,color] duration-150 ease-[ease] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // design line 121 — the primary CTA
        brutalPrimary:
          "inline-flex items-center justify-center border-[3px] border-ink bg-orange px-5 py-[13px] font-sans text-[15px] font-bold text-window shadow-[5px_5px_0_var(--color-ink)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--color-ink)]",

        // design line 122 — secondary, on paper/window backgrounds
        brutal:
          "inline-flex items-center justify-center border-2 border-ink bg-transparent px-[18px] py-[13px] font-mono text-[12.5px] text-ink hover:bg-yellow",

        // design line 238 — light-on-dark, inside the ink panels
        brutalDark:
          "inline-flex items-center justify-center border-2 border-window bg-window px-3.5 py-2.5 font-mono text-xs font-bold text-ink hover:border-yellow hover:bg-yellow",

        // design line 239 — the "hallucinated dosage" run
        brutalDanger:
          "inline-flex items-center justify-center border-2 border-orange bg-orange px-3.5 py-2.5 font-mono text-xs font-bold text-window hover:-translate-x-px hover:-translate-y-px",

        // design line 240 — the `reset` button, and the base for the case-02
        // word buttons (those add `px-[11px] py-2 border-window
        // hover:bg-yellow hover:text-ink hover:border-yellow`, lines 320–322)
        brutalGhostDark:
          "inline-flex items-center justify-center border-2 border-window/40 bg-transparent px-3.5 py-2.5 font-mono text-xs text-window hover:border-window",

        // design lines 75–79 — menu-bar tabs. Pass `data-active` to fill.
        brutalTab:
          "inline-flex items-center justify-center border-2 border-ink bg-transparent px-[7px] py-1 font-mono text-[10.5px] text-ink hover:shadow-[2px_2px_0_var(--color-ink)] data-[active=true]:bg-yellow",

        // design lines 179–214 — the case-list rows. Cases 01/02 lift to an
        // orange shadow; 03/04 pass `data-hover-shadow="ink"` for #16130F.
        brutalCard:
          "grid w-full items-center border-2 border-ink bg-card px-[17px] py-[15px] text-left text-ink shadow-[5px_5px_0_var(--color-ink)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_var(--color-orange)] data-[hover-shadow=ink]:hover:shadow-[8px_8px_0_var(--color-ink)]",
      },
    },
    defaultVariants: {
      variant: "brutal",
    },
  }
)

function Button({
  className,
  variant = "brutal",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
