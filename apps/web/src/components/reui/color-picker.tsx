"use client"

// Title: Color Picker
// Description: Shadcn color picker with a saturation area, hue, alpha and channel sliders, a hue wheel, HEX, RGB, HSL, HSB and OKLCH fields, swatches and an eye dropper.
import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import type {
  ComponentProps,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  Ref,
} from "react"
import { cn } from "cn"
import { flushSync } from "react-dom"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { ChevronDownIcon, PipetteIcon, CheckIcon, CopyIcon } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/** How a value is written: what `onValueChange` emits and what the fields show. */
export type ColorPickerFormat = "hex" | "rgb" | "hsl" | "hsb" | "oklch"

/** Where channels live. HSB is `hsv` here, after the math. */
export type ColorPickerColorSpace = "rgb" | "hsl" | "hsv" | "oklch"

export type ColorPickerChannel =
  | "hue"
  | "saturation"
  | "brightness"
  | "lightness"
  | "chroma"
  | "red"
  | "green"
  | "blue"
  | "alpha"

/**
 * A parsed color. Channels stay in the space they were given or edited in,
 * so the hue of a gray and an OKLCH color outside sRGB survive a round trip.
 * rgb runs 0 to 255; hsl and hsv take hue 0 to 360 and the rest 0 to 100;
 * oklch takes lightness 0 to 100, chroma 0 to 0.4 and hue 0 to 360. Alpha is
 * 0 to 1.
 */
export type ColorPickerColor = {
  space: ColorPickerColorSpace
  channels: [number, number, number]
  alpha: number
}

export type ColorPickerLabels = {
  /** Trigger text while there is no value. */
  placeholder: string
  /** Names the popup and an inline panel. */
  panelLabel: string
  /** The swatch button in `ColorPickerInput`. */
  openPicker: string
  /** The saturation and brightness area. */
  area: string
  hue: string
  saturation: string
  brightness: string
  lightness: string
  chroma: string
  red: string
  green: string
  blue: string
  alpha: string
  hex: string
  format: string
  eyeDropper: string
  copy: string
  copied: string
  clear: string
  swatches: string
}

export type ColorPickerFunctions = {
  /** Names a color for screen readers, in the area, the sliders and unlabelled swatches. */
  getColorName: (color: ColorPickerColor) => string
}

export type ColorPickerI18nConfig = {
  labels: ColorPickerLabels
  functions: ColorPickerFunctions
}

/** One level deeper than `Partial`, so a single label can be overridden. */
export type ColorPickerI18nOverrides = {
  labels?: Partial<ColorPickerLabels>
  functions?: Partial<ColorPickerFunctions>
}

type Triple = [number, number, number]

const SPACE_CHANNELS: Record<
  ColorPickerColorSpace,
  [ColorPickerChannel, ColorPickerChannel, ColorPickerChannel]
> = {
  rgb: ["red", "green", "blue"],
  hsl: ["hue", "saturation", "lightness"],
  hsv: ["hue", "saturation", "brightness"],
  oklch: ["lightness", "chroma", "hue"],
}

export const COLOR_PICKER_FORMATS: ColorPickerFormat[] = [
  "hex",
  "rgb",
  "hsl",
  "hsb",
  "oklch",
]

const FORMAT_LABELS: Record<ColorPickerFormat, string> = {
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
  hsb: "HSB",
  oklch: "OKLCH",
}

/* -------------------------------------------------------------------------- */
/*                                 Color math                                 */
/* -------------------------------------------------------------------------- */

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const wrapHue = (hue: number) => ((hue % 360) + 360) % 360

/* Trailing zeros dropped, and never "-0". */
const fixed = (value: number, digits: number) =>
  String(Number(value.toFixed(digits)) + 0)

function rgbToHsv([red, green, blue]: Triple, fallbackHue = 0): Triple {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const delta = max - Math.min(r, g, b)
  let hue = fallbackHue
  if (delta > 1e-9) {
    hue =
      max === r
        ? ((g - b) / delta) % 6
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4
    hue = wrapHue(hue * 60)
  }
  return [hue, max === 0 ? 0 : (delta / max) * 100, max * 100]
}

function hsvToRgb([hue, saturation, brightness]: Triple): Triple {
  const s = saturation / 100
  const v = brightness / 100
  const channel = (n: number) => {
    const k = (n + hue / 60) % 6
    return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255
  }
  return [channel(5), channel(3), channel(1)]
}

/* HSL and HSB share a hue, carried over as is, so a gray keeps it. */
function hsvToHsl([hue, saturation, brightness]: Triple): Triple {
  const s = saturation / 100
  const v = brightness / 100
  const l = v * (1 - s / 2)
  const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l)
  return [hue, sl * 100, l * 100]
}

function hslToHsv([hue, saturation, lightness]: Triple): Triple {
  const s = saturation / 100
  const l = lightness / 100
  const v = l + s * Math.min(l, 1 - l)
  return [hue, v === 0 ? 0 : 2 * (1 - l / v) * 100, v * 100]
}

const toLinear = (channel: number) => {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const fromLinear = (channel: number) =>
  255 *
  (channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * channel ** (1 / 2.4) - 0.055)

/* OKLab by Björn Ottosson, the matrices CSS Color 4 uses. Linear sRGB in,
   unbounded, so a wide-gamut color converts without clipping. */
function linearToOklab([r, g, b]: Triple): Triple {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/* OKLab, or polar a and b, to OKLCH in the picker's units: L 0 to 100. */
function oklabToOklch([lightness, a, b]: Triple, fallbackHue = 0): Triple {
  const chroma = Math.sqrt(a * a + b * b)
  const hue =
    chroma < 1e-4 ? fallbackHue : wrapHue((Math.atan2(b, a) * 180) / Math.PI)
  return [lightness * 100, chroma, hue]
}

function rgbToOklch(rgb: Triple, fallbackHue = 0): Triple {
  return oklabToOklch(linearToOklab(rgb.map(toLinear) as Triple), fallbackHue)
}

function oklchToLinear([lightness, chroma, hue]: Triple): Triple {
  const angle = (hue * Math.PI) / 180
  const L = lightness / 100
  const a = chroma * Math.cos(angle)
  const b = chroma * Math.sin(angle)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const inSrgb = (linear: Triple) =>
  linear.every((channel) => channel >= -1e-4 && channel <= 1 + 1e-4)

const clipLinear = (linear: Triple) =>
  linear.map((channel) => clamp(channel, 0, 1)) as Triple

/* How far a clipped color lands from the OKLCH it stands for, in OKLab. */
function clipError(clipped: Triple, [lightness, chroma, hue]: Triple) {
  const [l, a, b] = linearToOklab(clipped)
  const angle = (hue * Math.PI) / 180
  return Math.hypot(
    l - lightness / 100,
    a - chroma * Math.cos(angle),
    b - chroma * Math.sin(angle)
  )
}

/* CSS Color 4 gamut mapping: lower chroma at the same lightness and hue
   until clipping the rest moves the color less than a just-noticeable
   difference (0.02 in OKLab), then clip. Pure chroma reduction drifted up to
   27 units in hex from what a browser paints for Tailwind's P3 shades. */
function oklchToRgb([lightness, chroma, hue]: Triple): Triple {
  const encode = (linear: Triple) =>
    linear.map((channel) => fromLinear(channel)) as Triple
  if (lightness >= 100) return [255, 255, 255]
  if (lightness <= 0) return [0, 0, 0]
  const target: Triple = [lightness, Math.max(0, chroma), hue]
  const origin = oklchToLinear(target)
  if (inSrgb(origin)) return encode(clipLinear(origin))
  let clipped = clipLinear(origin)
  if (clipError(clipped, target) < 0.02) return encode(clipped)
  let low = 0
  let high = target[1]
  let lowInGamut = true
  while (high - low > 1e-4) {
    const mid = (low + high) / 2
    const current: Triple = [lightness, mid, hue]
    const linear = oklchToLinear(current)
    if (lowInGamut && inSrgb(linear)) {
      low = mid
      continue
    }
    clipped = clipLinear(linear)
    const error = clipError(clipped, current)
    if (error < 0.02) {
      if (0.02 - error < 1e-4) break
      lowInGamut = false
      low = mid
    } else {
      high = mid
    }
  }
  return encode(clipped)
}

function toRgb(color: ColorPickerColor): Triple {
  const { space, channels } = color
  if (space === "rgb") return channels
  if (space === "hsv") return hsvToRgb(channels)
  if (space === "hsl") return hsvToRgb(hslToHsv(channels))
  return oklchToRgb(channels)
}

/** A color's channels in another space. */
function toSpace(
  color: ColorPickerColor,
  space: ColorPickerColorSpace
): Triple {
  const { space: from, channels } = color
  if (from === space) return channels
  if (from === "hsv" && space === "hsl") return hsvToHsl(channels)
  if (from === "hsl" && space === "hsv") return hslToHsv(channels)
  const rgb = toRgb(color)
  const hue = from === "rgb" ? 0 : channels[from === "oklch" ? 2 : 0]
  if (space === "rgb") return rgb
  if (space === "hsv") return rgbToHsv(rgb, hue)
  if (space === "hsl") return hsvToHsl(rgbToHsv(rgb, hue))
  return rgbToOklch(rgb, hue)
}

/** Whether a color fits sRGB. OKLCH can reach past it; the picker then maps it into sRGB the way CSS does. */
export function isColorInSrgb(color: ColorPickerColor) {
  return color.space !== "oklch" || inSrgb(oklchToLinear(color.channels))
}

const HEX_PATTERN = /^#?([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/
/* [\s\S], not ".", so a function pretty-printed over several lines reads. */
const FUNCTION_PATTERN = /^([a-z][a-z\d-]*)\(([\s\S]*)\)$/
const NUMBER_PATTERN =
  /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg|rad|grad|turn)?$/

/* The 148 CSS named colors, each name then its hex: about 2.3 KB, checked
   against Chrome, and safe to read on the server unlike a canvas. */
const NAMED_COLORS =
  "alicebluef0f8ff antiquewhitefaebd7 aqua00ffff aquamarine7fffd4 " +
  "azuref0ffff beigef5f5dc bisqueffe4c4 black000000 blanchedalmondffebcd " +
  "blue0000ff blueviolet8a2be2 browna52a2a burlywooddeb887 " +
  "cadetblue5f9ea0 chartreuse7fff00 chocolated2691e coralff7f50 " +
  "cornflowerblue6495ed cornsilkfff8dc crimsondc143c cyan00ffff " +
  "darkblue00008b darkcyan008b8b darkgoldenrodb8860b darkgraya9a9a9 " +
  "darkgreen006400 darkgreya9a9a9 darkkhakibdb76b darkmagenta8b008b " +
  "darkolivegreen556b2f darkorangeff8c00 darkorchid9932cc darkred8b0000 " +
  "darksalmone9967a darkseagreen8fbc8f darkslateblue483d8b " +
  "darkslategray2f4f4f darkslategrey2f4f4f darkturquoise00ced1 " +
  "darkviolet9400d3 deeppinkff1493 deepskyblue00bfff dimgray696969 " +
  "dimgrey696969 dodgerblue1e90ff firebrickb22222 floralwhitefffaf0 " +
  "forestgreen228b22 fuchsiaff00ff gainsborodcdcdc ghostwhitef8f8ff " +
  "goldffd700 goldenroddaa520 gray808080 green008000 greenyellowadff2f " +
  "grey808080 honeydewf0fff0 hotpinkff69b4 indianredcd5c5c indigo4b0082 " +
  "ivoryfffff0 khakif0e68c lavendere6e6fa lavenderblushfff0f5 " +
  "lawngreen7cfc00 lemonchiffonfffacd lightblueadd8e6 lightcoralf08080 " +
  "lightcyane0ffff lightgoldenrodyellowfafad2 lightgrayd3d3d3 " +
  "lightgreen90ee90 lightgreyd3d3d3 lightpinkffb6c1 lightsalmonffa07a " +
  "lightseagreen20b2aa lightskyblue87cefa lightslategray778899 " +
  "lightslategrey778899 lightsteelblueb0c4de lightyellowffffe0 lime00ff00 " +
  "limegreen32cd32 linenfaf0e6 magentaff00ff maroon800000 " +
  "mediumaquamarine66cdaa mediumblue0000cd mediumorchidba55d3 " +
  "mediumpurple9370db mediumseagreen3cb371 mediumslateblue7b68ee " +
  "mediumspringgreen00fa9a mediumturquoise48d1cc mediumvioletredc71585 " +
  "midnightblue191970 mintcreamf5fffa mistyroseffe4e1 moccasinffe4b5 " +
  "navajowhiteffdead navy000080 oldlacefdf5e6 olive808000 olivedrab6b8e23 " +
  "orangeffa500 orangeredff4500 orchidda70d6 palegoldenrodeee8aa " +
  "palegreen98fb98 paleturquoiseafeeee palevioletreddb7093 " +
  "papayawhipffefd5 peachpuffffdab9 perucd853f pinkffc0cb plumdda0dd " +
  "powderblueb0e0e6 purple800080 rebeccapurple663399 redff0000 " +
  "rosybrownbc8f8f royalblue4169e1 saddlebrown8b4513 salmonfa8072 " +
  "sandybrownf4a460 seagreen2e8b57 seashellfff5ee siennaa0522d " +
  "silverc0c0c0 skyblue87ceeb slateblue6a5acd slategray708090 " +
  "slategrey708090 snowfffafa springgreen00ff7f steelblue4682b4 tand2b48c " +
  "teal008080 thistled8bfd8 tomatoff6347 turquoise40e0d0 violetee82ee " +
  "wheatf5deb3 whiteffffff whitesmokef5f5f5 yellowffff00 " +
  "yellowgreen9acd32"

let namedColors: Map<string, string> | null = null

function namedColor(name: string) {
  namedColors ??= new Map(
    NAMED_COLORS.split(" ").map((entry) => [
      entry.slice(0, -6),
      entry.slice(-6),
    ])
  )
  return namedColors.get(name)
}

/* One CSS number: 100% is worth `percentOf`, computed as value * percentOf
   / 100 so 50% of 255 is exactly 127.5; angles only where allowed. */
function readNumber(token: string, percentOf: number, angle = false) {
  if (token === "none") return 0
  const match = NUMBER_PATTERN.exec(token)
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isFinite(value)) return null
  const unit = match[2]
  if (!unit) return value
  if (unit === "%") return angle ? null : (value * percentOf) / 100
  if (!angle) return null
  if (unit === "rad") return (value * 180) / Math.PI
  if (unit === "grad") return value * 0.9
  if (unit === "turn") return value * 360
  return value
}

type Matrix = [Triple, Triple, Triple]

const multiply = (matrix: Matrix, [x, y, z]: Triple): Triple =>
  matrix.map((row) => row[0] * x + row[1] * y + row[2] * z) as Triple

const compose = (outer: Matrix, inner: Matrix): Matrix =>
  outer.map((row) =>
    [0, 1, 2].map(
      (column) =>
        row[0] * inner[0][column] +
        row[1] * inner[1][column] +
        row[2] * inner[2][column]
    )
  ) as Matrix

/* CSS Color 4's matrices: XYZ D65 to linear sRGB, each RGB space to XYZ,
   and Bradford from D50, the white of lab(), lch() and ProPhoto. */
const XYZ_TO_SRGB: Matrix = [
  [12831 / 3959, -329 / 214, -1974 / 3959],
  [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
  [705 / 12673, -2585 / 12673, 705 / 667],
]
const D50_TO_D65: Matrix = [
  [0.955473421488075, -0.02309845494876471, 0.06325924320057072],
  [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323],
  [0.012314014864481998, -0.020507649298898964, 1.330365926242124],
]
const D50_TO_SRGB = compose(XYZ_TO_SRGB, D50_TO_D65)

/* sRGB's curve, carried past 0 and 1 by symmetry, as color() allows. */
const decodeSrgb = (value: number) => {
  const size = Math.abs(value)
  return (
    Math.sign(value) *
    (size <= 0.04045 ? size / 12.92 : ((size + 0.055) / 1.055) ** 2.4)
  )
}

const RGB_SPACES: Record<
  string,
  { decode: (value: number) => number; toSrgb: Matrix | null }
> = {
  srgb: { decode: decodeSrgb, toSrgb: null },
  "srgb-linear": { decode: (value) => value, toSrgb: null },
  "display-p3": {
    decode: decodeSrgb,
    toSrgb: compose(XYZ_TO_SRGB, [
      [0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
      [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
      [0, 0.04511338185890264, 1.043944368900976],
    ]),
  },
  "a98-rgb": {
    decode: (value) => Math.sign(value) * Math.abs(value) ** (563 / 256),
    toSrgb: compose(XYZ_TO_SRGB, [
      [573536 / 994567, 263643 / 1420810, 187206 / 994567],
      [591459 / 1989134, 6239551 / 9945670, 374412 / 4972835],
      [53769 / 1989134, 351524 / 4972835, 4929758 / 4972835],
    ]),
  },
  "prophoto-rgb": {
    decode: (value) => {
      const size = Math.abs(value)
      return size <= 16 / 512 ? value / 16 : Math.sign(value) * size ** 1.8
    },
    toSrgb: compose(D50_TO_SRGB, [
      [0.7977666449006423, 0.13518129740053308, 0.0313477341283922],
      [0.2880748288194013, 0.711835234241873, 0.00008993693872564],
      [0, 0, 0.8251046025104602],
    ]),
  },
  rec2020: {
    decode: (value) => {
      const size = Math.abs(value)
      return size < 0.018053968510807 * 4.5
        ? value / 4.5
        : Math.sign(value) *
            ((size + 0.09929682680944) / 1.09929682680944) ** (1 / 0.45)
    },
    toSrgb: compose(XYZ_TO_SRGB, [
      [0.6369580483012914, 0.14461690358620832, 0.1688809751641721],
      [0.2627002120112671, 0.6779980715188708, 0.05930171646986196],
      [0, 0.028072693049087428, 1.060985057710791],
    ]),
  },
  xyz: { decode: (value) => value, toSrgb: XYZ_TO_SRGB },
  "xyz-d65": { decode: (value) => value, toSrgb: XYZ_TO_SRGB },
  "xyz-d50": { decode: (value) => value, toSrgb: D50_TO_SRGB },
}

/* CIE Lab, D50 white, to XYZ D50, as CSS Color 4 writes it. */
function labToXyz([lightness, a, b]: Triple): Triple {
  const kappa = 24389 / 27
  const epsilon = 216 / 24389
  const fy = (lightness + 16) / 116
  const fx = a / 500 + fy
  const fz = fy - b / 200
  const x = fx ** 3 > epsilon ? fx ** 3 : (116 * fx - 16) / kappa
  const y = lightness > kappa * epsilon ? fy ** 3 : lightness / kappa
  const z = fz ** 3 > epsilon ? fz ** 3 : (116 * fz - 16) / kappa
  return [x * (0.3457 / 0.3585), y, z * ((1 - 0.3457 - 0.3585) / 0.3585)]
}

/* A color that can reach past sRGB is kept as OKLCH, so nothing is clipped
   until a format or a screen needs sRGB. */
const fromLinearSrgb = (linear: Triple): Triple =>
  oklabToOklch(linearToOklab(linear))

const isUnit = (channels: Triple) =>
  channels.every((channel) => channel >= -1e-6 && channel <= 1 + 1e-6)

/* The channels of one function, as a color in the picker's spaces. */
function readChannels(
  name: string,
  parts: string[]
): { space: ColorPickerColorSpace; channels: Triple } | null {
  if (name === "rgb") {
    const rgb = parts.map((part) => readNumber(part, 255))
    if (rgb.some((value) => value === null)) return null
    return {
      space: "rgb",
      channels: rgb.map((value) => clamp(value!, 0, 255)) as Triple,
    }
  }
  if (name === "hsl" || name === "hsv" || name === "hsb" || name === "hwb") {
    const hue = readNumber(parts[0], 1, true)
    const first = readNumber(parts[1], 100)
    const second = readNumber(parts[2], 100)
    if (hue === null || first === null || second === null) return null
    const x = clamp(first, 0, 100)
    const y = clamp(second, 0, 100)
    if (name === "hsl") return { space: "hsl", channels: [hue, x, y] }
    if (name !== "hwb") return { space: "hsv", channels: [hue, x, y] }
    /* hwb(): whiteness and blackness are HSB's saturation and brightness
       read from the other end; summing past 100% gives their gray. */
    const total = x + y
    if (total >= 100) {
      return { space: "hsv", channels: [hue, 0, (x / total) * 100] }
    }
    const brightness = 100 - y
    return {
      space: "hsv",
      channels: [hue, (1 - x / brightness) * 100, brightness],
    }
  }
  if (name === "oklch" || name === "oklab") {
    const lightness = readNumber(parts[0], 1)
    const second = readNumber(parts[1], 0.4)
    const third =
      name === "oklch"
        ? readNumber(parts[2], 1, true)
        : readNumber(parts[2], 0.4)
    if (lightness === null || second === null || third === null) return null
    const l = clamp(lightness, 0, 1)
    if (name === "oklch") {
      return {
        space: "oklch",
        channels: [l * 100, Math.max(0, second), third],
      }
    }
    return {
      space: "oklch",
      channels: oklabToOklch([l, second, third]),
    }
  }
  if (name === "lab" || name === "lch") {
    const lightness = readNumber(parts[0], 100)
    const second = readNumber(parts[1], name === "lab" ? 125 : 150)
    const third =
      name === "lch" ? readNumber(parts[2], 1, true) : readNumber(parts[2], 125)
    if (lightness === null || second === null || third === null) return null
    const l = clamp(lightness, 0, 100)
    const angle = (third * Math.PI) / 180
    const [a, b] =
      name === "lab"
        ? [second, third]
        : [
            Math.max(0, second) * Math.cos(angle),
            Math.max(0, second) * Math.sin(angle),
          ]
    return {
      space: "oklch",
      channels: fromLinearSrgb(multiply(D50_TO_SRGB, labToXyz([l, a, b]))),
    }
  }
  if (name === "color") {
    const target = RGB_SPACES[parts[0]]
    if (!target || parts.length !== 4) return null
    const values = parts.slice(1).map((part) => readNumber(part, 1))
    if (values.some((value) => value === null)) return null
    const channels = values as Triple
    if (parts[0] === "srgb" && isUnit(channels)) {
      return {
        space: "rgb",
        channels: channels.map((value) => clamp(value, 0, 1) * 255) as Triple,
      }
    }
    const linear = channels.map(target.decode) as Triple
    return {
      space: "oklch",
      channels: fromLinearSrgb(
        target.toSrgb ? multiply(target.toSrgb, linear) : linear
      ),
    }
  }
  return null
}

/**
 * Reads a CSS color: hex with 3, 4, 6 or 8 digits, `#` optional; the 148
 * named colors and `transparent`; `rgb()`, `hsl()`, `hwb()`, `lab()`,
 * `lch()`, `oklab()`, `oklch()` and `color()` in any of CSS Color 4's RGB
 * and XYZ spaces, plus `hsb()` or `hsv()`; modern or comma syntax, with or
 * without alpha. A color that can fall outside sRGB is kept as OKLCH.
 * Anything else, `var()` and `currentColor` included, is `null`.
 */
export function parseColor(
  input: string | null | undefined
): ColorPickerColor | null {
  if (typeof input !== "string") return null
  const text = input.trim().toLowerCase()
  if (!text) return null
  if (text === "transparent") {
    return { space: "rgb", channels: [0, 0, 0], alpha: 0 }
  }
  const hex = HEX_PATTERN.exec(namedColor(text) ?? text)
  if (hex) {
    let digits = hex[1]
    if (digits.length <= 4) {
      digits = [...digits].map((digit) => digit + digit).join("")
    }
    const byte = (index: number) => parseInt(digits.slice(index, index + 2), 16)
    return {
      space: "rgb",
      channels: [byte(0), byte(2), byte(4)],
      alpha: digits.length === 8 ? byte(6) / 255 : 1,
    }
  }
  const call = FUNCTION_PATTERN.exec(text)
  if (!call) return null
  const name = call[1].replace(/a$/, "")
  const [main, slash, ...rest] = call[2].split("/")
  if (rest.length > 0) return null
  const parts = main.split(/[\s,]+/).filter(Boolean)
  /* color() names its space first, and takes alpha only after a slash. */
  const count = name === "color" ? 4 : 3
  /* Alpha follows a slash, or is the fourth value of the comma syntax. */
  const alphaToken = slash?.trim() ?? (name === "color" ? undefined : parts[3])
  if (
    parts.length !== count &&
    !(name !== "color" && parts.length === 4 && slash === undefined)
  ) {
    return null
  }
  const alpha = alphaToken === undefined ? 1 : readNumber(alphaToken, 1)
  const read = readChannels(name, parts.slice(0, count))
  if (alpha === null || !read) return null
  const channels = read.channels
  if (channels.some((channel) => !Number.isFinite(channel))) return null
  if (read.space !== "rgb") {
    const hueIndex = read.space === "oklch" ? 2 : 0
    channels[hueIndex] = wrapHue(channels[hueIndex])
  }
  return { space: read.space, channels, alpha: clamp(alpha, 0, 1) }
}

const CSS_WIDE = /^(inherit|initial|unset|revert|revert-layer|currentcolor)$/

/* Whatever else the browser paints (color-mix(), relative colors,
   light-dark(), system colors), resolved by its computed style, which
   serializes as a function parseColor reads. Two parents of different
   colors expose anything that inherits (var() with no value, a CSS-wide
   keyword); a canvas would have read those as black. Only typing reaches
   this, never a render. */
function parseWithBrowser(text: string): ColorPickerColor | null {
  if (
    typeof document === "undefined" ||
    CSS_WIDE.test(text.toLowerCase()) ||
    !CSS.supports?.("color", text)
  ) {
    return null
  }
  const parent = document.createElement("div")
  const probe = document.createElement("div")
  parent.style.display = "none"
  probe.style.color = text
  parent.append(probe)
  document.body.append(parent)
  parent.style.color = "rgb(1, 2, 3)"
  const first = getComputedStyle(probe).color
  parent.style.color = "rgb(4, 5, 6)"
  const second = getComputedStyle(probe).color
  parent.remove()
  return first === second ? parseColor(first) : null
}

/**
 * Writes a color in a format. HEX gains a fourth byte and the others a
 * `/ alpha` only when the color is translucent; OKLCH keeps channels outside
 * sRGB, every other format maps the color into sRGB the way CSS does.
 */
export function formatColor(
  color: ColorPickerColor,
  format: ColorPickerFormat
): string {
  const alpha = clamp(color.alpha, 0, 1)
  /* Decided on the rounded alpha, so 0.996 writes no "/ 1" tail. */
  const tail = fixed(alpha, 2) !== "1" ? ` / ${fixed(alpha, 2)}` : ""
  if (format === "hex" || format === "rgb") {
    const rgb = toRgb(color).map((channel) =>
      Math.round(clamp(channel, 0, 255))
    )
    if (format === "rgb") return `rgb(${rgb.join(" ")}${tail})`
    const opacity = Math.round(alpha * 255)
    const bytes = opacity < 255 ? [...rgb, opacity] : rgb
    return `#${bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("")}`
  }
  if (format === "oklch") {
    const [l, c, h] = toSpace(color, "oklch")
    /* Fine enough that hex to OKLCH and back is exact: 0 of 140,608 colors
       drift, where 0.1% and 3 decimals moved 29,278 by up to 7. */
    /* Chroma is never below 0, and a hue that rounds to 360 is 0. */
    const hue = fixed(wrapHue(Number(h.toFixed(3))), 3)
    return `oklch(${fixed(l, 2)}% ${fixed(Math.max(0, c), 5)} ${hue}${tail})`
  }
  const [h, s, third] = toSpace(color, format === "hsl" ? "hsl" : "hsv")
  return `${format}(${fixed(h, 1)} ${fixed(s, 1)}% ${fixed(third, 1)}%${tail})`
}

/* What CSS paints: OKLCH as itself, so a wide-gamut screen shows it. */
const toCss = (color: ColorPickerColor) =>
  formatColor(color, color.space === "oklch" ? "oklch" : "rgb")

function luminance(rgb: Triple) {
  const [r, g, b] = rgb.map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/* A translucent color composited onto an opaque one. */
function over(top: ColorPickerColor, bottom: Triple): Triple {
  const rgb = toRgb(top)
  return rgb.map(
    (channel, index) => channel * top.alpha + bottom[index] * (1 - top.alpha)
  ) as Triple
}

/**
 * The WCAG 2 contrast ratio, 1 to 21. A translucent foreground is laid over
 * the background, and a translucent background over white. `null` when either
 * color does not parse.
 */
export function getContrastRatio(
  foreground: string | ColorPickerColor,
  background: string | ColorPickerColor
): number | null {
  const front =
    typeof foreground === "string" ? parseColor(foreground) : foreground
  const back =
    typeof background === "string" ? parseColor(background) : background
  if (!front || !back) return null
  const base = over(back, [255, 255, 255])
  const a = luminance(over(front, base))
  const b = luminance(base)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/* The relative luminance where light and dark text read about equally well.
   It matches the APCA choice on all 110 Tailwind shades from 300 to 700; the
   WCAG 2 ratio flips near 0.18 and puts dark text on blue-500 and red-500. */
const FOREGROUND_SWITCH = 0.36

/**
 * The text color that reads better on a background: `light` on a dark one,
 * `dark` on a light one. Light text also has to reach 3:1 by WCAG 2, the AA
 * bar for large text and icons, so orange-500 and sky-500 take dark text.
 * A translucent background is laid over white, as in `getContrastRatio`.
 * `null` when the background does not parse.
 */
export function getForegroundColor(
  background: string | ColorPickerColor,
  {
    light = "#ffffff",
    dark = "#0a0a0a",
  }: { light?: string; dark?: string } = {}
): string | null {
  const color =
    typeof background === "string" ? parseColor(background) : background
  if (!color) return null
  return luminance(over(color, [255, 255, 255])) < FOREGROUND_SWITCH &&
    (getContrastRatio(light, color) ?? 0) >= 3
    ? light
    : dark
}

/* OKLCH hue boundaries, each the upper end of its name. */
const HUE_NAMES: Array<[number, string]> = [
  [15, "pink"],
  [45, "red"],
  [80, "orange"],
  [120, "yellow"],
  [135, "lime"],
  [165, "green"],
  [205, "cyan"],
  [250, "sky blue"],
  [280, "blue"],
  [300, "violet"],
  [320, "purple"],
  [345, "magenta"],
  [360, "pink"],
]

/** A rough English name: "dark vibrant blue", "light gray". Swap it through `i18n.functions`. */
function nameColor(color: ColorPickerColor) {
  const [lightness, chroma, hue] = toSpace(color, "oklch")
  const l = lightness / 100
  if (chroma < 0.025) {
    if (l < 0.2) return "black"
    if (l < 0.45) return "dark gray"
    if (l < 0.75) return "gray"
    return l < 0.95 ? "light gray" : "white"
  }
  let name = HUE_NAMES.find(([end]) => hue < end)?.[1] ?? "pink"
  if (l < 0.6 && hue >= 40 && hue < 100) name = "brown"
  else if (l < 0.6 && hue >= 100 && hue < 135) name = "olive"
  const tone = chroma < 0.07 ? "grayish " : chroma > 0.2 ? "vibrant " : ""
  const shade = l < 0.45 ? "dark " : l > 0.82 ? "light " : ""
  return `${shade}${tone}${name}`
}

export const DEFAULT_COLOR_PICKER_I18N: ColorPickerI18nConfig = {
  labels: {
    placeholder: "Select color",
    panelLabel: "Choose color",
    openPicker: "Open color picker",
    area: "Color",
    hue: "Hue",
    saturation: "Saturation",
    brightness: "Brightness",
    lightness: "Lightness",
    chroma: "Chroma",
    red: "Red",
    green: "Green",
    blue: "Blue",
    alpha: "Opacity",
    hex: "Hex",
    format: "Color format",
    eyeDropper: "Pick a color from the screen",
    copy: "Copy color",
    copied: "Copied",
    clear: "Clear",
    swatches: "Swatches",
  },
  functions: { getColorName: nameColor },
}

/** Merges per section, so an override can carry one key without restating the rest. */
export function mergeColorPickerI18n(
  overrides?: ColorPickerI18nOverrides
): ColorPickerI18nConfig {
  if (!overrides?.labels && !overrides?.functions) {
    return DEFAULT_COLOR_PICKER_I18N
  }
  return {
    labels: { ...DEFAULT_COLOR_PICKER_I18N.labels, ...overrides.labels },
    functions: {
      ...DEFAULT_COLOR_PICKER_I18N.functions,
      ...overrides.functions,
    },
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Channels                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_SPACE: Record<ColorPickerChannel, ColorPickerColorSpace> = {
  hue: "hsv",
  saturation: "hsv",
  brightness: "hsv",
  lightness: "hsl",
  chroma: "oklch",
  red: "rgb",
  green: "rgb",
  blue: "rgb",
  alpha: "rgb",
}

/* A space that has no such channel falls back to the channel's own. */
const resolveSpace = (
  channel: ColorPickerChannel,
  space: ColorPickerColorSpace | undefined
) =>
  channel !== "alpha" && space && SPACE_CHANNELS[space].includes(channel)
    ? space
    : DEFAULT_SPACE[channel]

function channelRange(
  space: ColorPickerColorSpace,
  channel: ColorPickerChannel
) {
  if (channel === "alpha") return { max: 1, step: 0.01 }
  if (channel === "hue") return { max: 360, step: 1 }
  if (channel === "chroma") return { max: 0.4, step: 0.004 }
  return { max: space === "rgb" ? 255 : 100, step: 1 }
}

function readChannel(
  color: ColorPickerColor,
  space: ColorPickerColorSpace,
  channel: ColorPickerChannel
) {
  if (channel === "alpha") return color.alpha
  return toSpace(color, space)[SPACE_CHANNELS[space].indexOf(channel)]
}

function withChannel(
  color: ColorPickerColor,
  space: ColorPickerColorSpace,
  channel: ColorPickerChannel,
  value: number
): ColorPickerColor {
  if (channel === "alpha") return { ...color, alpha: clamp(value, 0, 1) }
  const channels = [...toSpace(color, space)] as Triple
  channels[SPACE_CHANNELS[space].indexOf(channel)] = value
  return { space, channels, alpha: color.alpha }
}

/* Screen reader text for one channel: "210°, blue", "50%", "128". */
function channelValueText(
  color: ColorPickerColor,
  space: ColorPickerColorSpace,
  channel: ColorPickerChannel,
  i18n: ColorPickerI18nConfig
) {
  const value = readChannel(color, space, channel)
  if (channel === "alpha") return `${Math.round(value * 100)}%`
  if (channel === "chroma") return fixed(value, 3)
  if (channel === "hue") {
    return `${Math.round(value)}°, ${i18n.functions.getColorName(color)}`
  }
  return space === "rgb" ? String(Math.round(value)) : `${Math.round(value)}%`
}

/* The colors a track runs through: the full spectrum for hue, so a gray
   still shows where it would go, and sampled stops elsewhere, since OKLCH
   and HSL lightness do not run straight in sRGB. */
function trackStops(
  color: ColorPickerColor,
  space: ColorPickerColorSpace,
  channel: ColorPickerChannel
) {
  const opaque = { ...color, alpha: 1 }
  if (channel === "alpha") return ["transparent", toCss(opaque)]
  let base = opaque
  if (channel === "hue") {
    base =
      space === "oklch"
        ? withChannel(
            opaque,
            "oklch",
            "chroma",
            Math.max(readChannel(opaque, "oklch", "chroma"), 0.12)
          )
        : { space: "hsv", channels: [0, 100, 100], alpha: 1 }
  }
  const count =
    channel === "hue" || space === "oklch"
      ? 13
      : space === "hsl" && channel === "lightness"
        ? 3
        : 2
  const { max } = channelRange(space, channel)
  const target = channel === "hue" && space !== "oklch" ? "hsv" : space
  return Array.from({ length: count }, (_, index) =>
    formatColor(
      withChannel(base, target, channel, (max * index) / (count - 1)),
      "rgb"
    )
  )
}

/* The transparency grid behind translucent colors, in theme tokens. */
const CHECKER =
  "repeating-conic-gradient(var(--color-muted) 0 25%, var(--color-background) 0 50%) 50% / 8px 8px"

/* -------------------------------------------------------------------------- */
/*                                   Context                                  */
/* -------------------------------------------------------------------------- */

/* What the controls show while the value is empty: white, hue 0. */
const EMPTY_COLOR: ColorPickerColor = {
  space: "hsv",
  channels: [0, 0, 100],
  alpha: 1,
}

type ColorPickerContextValue = {
  id: string
  value: string | null
  /** The color written in `format` for display, hex in capitals, or `null`. */
  text: string | null
  /** The committed color, or `null` while empty. */
  color: ColorPickerColor | null
  /** What the controls show: the color, or white while empty. */
  display: ColorPickerColor
  format: ColorPickerFormat
  alpha: boolean
  i18n: ColorPickerI18nConfig
  disabled: boolean
  readOnly: boolean
  editable: boolean
  invalid: boolean
  required: boolean
  label: string | undefined
  labelledBy: string | undefined
  describedBy: string | undefined
  swatches: string[] | undefined
  open: boolean
  setOpen: (open: boolean) => void
  /** The latest color, for handlers that fire before the next render. */
  getColor: () => ColorPickerColor
  /** Changes the value mid-interaction; `onValueCommit` waits for the end. */
  emit: (color: ColorPickerColor | null) => void
  startInteraction: () => void
  endInteraction: () => void
  /** A whole interaction in one: emits and commits. */
  change: (color: ColorPickerColor | null) => void
  /** The trigger or the input: where a failed `required` check sends focus. */
  registerFocusTarget: (node: HTMLElement | null) => void
  /** The format on screen: the fields' when they are shown, else `format`. */
  shownFormat: ColorPickerFormat
  setFieldsFormat: (format: ColorPickerFormat | null) => void
  /** Writes the value to the clipboard, in the format on screen by default. */
  copy: (format?: ColorPickerFormat) => void
  /** The format just copied, for 1.5 seconds, so its button can confirm. */
  copied: ColorPickerFormat | null
}

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null)

/** "inline" unless a part renders inside `ColorPickerContent`. */
const SurfaceContext = createContext<"inline" | "popup">("inline")

function useColorPickerContext(part: string) {
  const context = useContext(ColorPickerContext)
  if (!context) throw new Error(`${part} must be used within a ColorPicker`)
  return context
}

export type ColorPickerApi = {
  /** The value as emitted, or `null`. */
  value: string | null
  color: ColorPickerColor | null
  format: ColorPickerFormat
  open: boolean
  setOpen: (open: boolean) => void
  /** Commits any color `parseColor` reads; `null` or `""` clears, anything else is ignored. */
  setValue: (value: string | null) => void
  clear: () => void
}

/** The picker's state and actions, inside a `ColorPicker`. */
export function useColorPicker(): ColorPickerApi {
  const context = useColorPickerContext("useColorPicker")
  return {
    value: context.value,
    color: context.color,
    format: context.format,
    open: context.open,
    setOpen: context.setOpen,
    setValue: (value) => {
      if (!value) return context.change(null)
      const parsed = parseColor(value)
      if (parsed) context.change(parsed)
    },
    clear: () => context.change(null),
  }
}

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node)
  else if (ref) ref.current = node
}

/* -------------------------------------------------------------------------- */
/*                                    Root                                    */
/* -------------------------------------------------------------------------- */

export type ColorPickerProps = {
  /** Controlled value: any color `parseColor` reads. `null` is empty. */
  value?: string | null
  defaultValue?: string | null
  /** Fires on every change, a drag included, with the value in `format`. */
  onValueChange?: (value: string | null) => void
  /** Fires once an interaction ends: a drag released, a key, a field, a swatch. */
  onValueCommit?: (value: string | null) => void
  /** How the value is written. */
  format?: ColorPickerFormat
  /** Adds the opacity slider and field, and lets the value carry alpha. */
  alpha?: boolean
  /** Preset colors under the default panel. */
  swatches?: string[]
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  readOnly?: boolean
  invalid?: boolean
  /** Submits the value with a native form under this name. */
  name?: string
  form?: string
  required?: boolean
  /** The hidden form field, for form libraries that focus a field on error. */
  inputRef?: Ref<HTMLInputElement>
  /** Lands on the trigger or the input. */
  id?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  i18n?: ColorPickerI18nOverrides
  /** Without children the picker renders a trigger and a popover; these reach the trigger. */
  placeholder?: string
  className?: string
  children?: ReactNode
}

export function ColorPicker({
  value,
  defaultValue = null,
  onValueChange,
  onValueCommit,
  format = "hex",
  alpha = false,
  swatches,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  readOnly = false,
  invalid = false,
  name,
  form,
  required = false,
  inputRef,
  id: idProp,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  i18n: i18nProp,
  placeholder,
  className,
  children,
}: ColorPickerProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  /* What a form reset restores, as a native field returns to its default. */
  const [initialValue] = useState(defaultValue)
  const [openState, setOpenState] = useState(defaultOpen)
  const open = openProp ?? openState
  const raw = (value !== undefined ? value : uncontrolled) || null

  /* The channels behind the value, kept in the space they were edited in. A
     value from outside is parsed afresh; one this picker emitted keeps its
     channels, so the hue of a gray and an OKLCH chroma survive. */
  const [held, setHeld] = useState(() => ({
    value: raw,
    color: parseColor(raw),
  }))
  let color = held.color
  if (held.value !== raw) {
    color = parseColor(raw)
    setHeld({ value: raw, color })
  }
  if (color && !alpha && color.alpha !== 1) color = { ...color, alpha: 1 }
  const display = color ?? EMPTY_COLOR

  const latest = useRef({ value: raw, color: display })
  useLayoutEffect(() => {
    latest.current = { value: raw, color: display }
  })
  const interaction = useRef<{ from: string | null } | null>(null)
  const focusTarget = useRef<HTMLElement | null>(null)
  const fieldRef = useRef<HTMLInputElement | null>(null)
  const resetRef = useRef(() => {})
  const i18n = mergeColorPickerI18n(i18nProp)
  const editable = !disabled && !readOnly

  const setOpen = (next: boolean) => {
    if (next && disabled) return
    if (openProp === undefined) setOpenState(next)
    onOpenChange?.(next)
  }

  const canonical = (text: string | null) => {
    const parsed = parseColor(text)
    if (!parsed) return null
    return formatColor(alpha ? parsed : { ...parsed, alpha: 1 }, format)
  }

  const emit = (next: ColorPickerColor | null) => {
    if (!editable) return
    const normalized = next && !alpha ? { ...next, alpha: 1 } : next
    const nextValue = normalized ? formatColor(normalized, format) : null
    const previous = latest.current.value
    /* The same color written another way, `#FF0000` for `#ff0000`, keeps its
       string: no change is emitted that nobody made. */
    const same = nextValue === previous || nextValue === canonical(previous)
    const kept = same ? previous : nextValue
    latest.current = { value: kept, color: normalized ?? EMPTY_COLOR }
    setHeld({ value: kept, color: normalized })
    if (same) return
    if (value === undefined) setUncontrolled(nextValue)
    onValueChange?.(nextValue)
  }

  const startInteraction = () => {
    interaction.current = { from: latest.current.value }
  }

  const endInteraction = () => {
    const started = interaction.current
    interaction.current = null
    if (started && started.from !== latest.current.value) {
      onValueCommit?.(latest.current.value)
    }
  }

  /* The fields report the format they show, so a copy takes what is seen. */
  const [fieldsFormat, setFieldsFormat] = useState<ColorPickerFormat | null>(
    null
  )
  const shownFormat = fieldsFormat ?? format
  const [copied, setCopied] = useState<ColorPickerFormat | null>(null)
  const copiedTimer = useRef(0)
  useEffect(() => () => window.clearTimeout(copiedTimer.current), [])

  const context: ColorPickerContextValue = {
    id,
    value: raw,
    text: color
      ? format === "hex"
        ? formatColor(color, format).toUpperCase()
        : formatColor(color, format)
      : null,
    color,
    display,
    format,
    alpha,
    i18n,
    disabled,
    readOnly,
    editable,
    invalid,
    required,
    label,
    labelledBy,
    describedBy,
    swatches,
    open,
    setOpen,
    getColor: () => latest.current.color,
    emit,
    startInteraction,
    endInteraction,
    change: (next) => {
      startInteraction()
      emit(next)
      endInteraction()
    },
    registerFocusTarget: (node) => {
      if (node) focusTarget.current = node
    },
    shownFormat,
    setFieldsFormat,
    copy: (to = shownFormat) => {
      if (!color) return
      navigator.clipboard?.writeText(formatColor(color, to)).then(
        () => {
          setCopied(to)
          window.clearTimeout(copiedTimer.current)
          copiedTimer.current = window.setTimeout(() => setCopied(null), 1500)
        },
        /* No clipboard permission: nothing was copied, nothing to confirm. */
        () => {}
      )
    },
    copied,
  }

  useEffect(() => {
    resetRef.current = () => context.change(parseColor(initialValue))
  })

  /* Listens on the field's own root and asks for its form at reset time, so a
     `form` attribute is honoured. The restore waits a task, like a native
     reset's default action, because any listener may still cancel it. */
  const hasField = !!name || required
  useEffect(() => {
    const root = fieldRef.current?.getRootNode()
    if (!root) return
    let pending = 0
    const onReset = (event: Event) => {
      if (event.target !== fieldRef.current?.form) return
      pending = window.setTimeout(() => {
        if (!event.defaultPrevented) resetRef.current()
      })
    }
    root.addEventListener("reset", onReset, true)
    return () => {
      root.removeEventListener("reset", onReset, true)
      window.clearTimeout(pending)
    }
  }, [hasField])

  return (
    <ColorPickerContext.Provider value={context}>
      <Popover open={open} onOpenChange={(next) => setOpen(next)}>
        {children === undefined ? (
          <>
            <ColorPickerTrigger
              className={className}
              placeholder={placeholder}
            />
            <ColorPickerContent />
          </>
        ) : (
          children
        )}
      </Popover>
      <span role="status" className="sr-only">
        {copied ? i18n.labels.copied : ""}
      </span>
      {hasField && (
        <input
          ref={(node) => {
            fieldRef.current = node
            assignRef(inputRef, node)
          }}
          type="text"
          name={name}
          form={form}
          required={required && !readOnly}
          disabled={disabled}
          value={color ? formatColor(color, format) : ""}
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden="true"
          data-slot="color-picker-field"
          /* A failed `required` check focuses this field; hand that to the control. */
          onFocus={(event) => {
            const target =
              (focusTarget.current?.isConnected ? focusTarget.current : null) ??
              event.currentTarget.ownerDocument.getElementById(`${id}-area`)
            if (target) target.focus()
            else event.currentTarget.blur()
          }}
          className="pointer-events-none absolute size-px max-w-px opacity-0"
        />
      )}
    </ColorPickerContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Swatch                                   */
/* -------------------------------------------------------------------------- */

/* The inset ring keeps a white swatch visible on a white surface. */
const SWATCH_CLASS =
  "forced-color-adjust-none relative inline-flex size-4 shrink-0 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:inset-ring after:inset-ring-foreground/10"

/* A small square chip takes the shadcn Checkbox's radius in each style. */
const SWATCH_SQUARE =
  "rounded-[6px]"

/* A slash through an empty swatch, the convention for "no color". */
const EMPTY_SWATCH =
  "linear-gradient(to top right, transparent calc(50% - 0.75px), var(--color-destructive) calc(50% - 0.75px) calc(50% + 0.75px), transparent calc(50% + 0.75px))"

function swatchBackground(color: ColorPickerColor | null) {
  if (!color) return EMPTY_SWATCH
  const css = toCss(color)
  return color.alpha < 1 ? `linear-gradient(${css}, ${css}), ${CHECKER}` : css
}

export type ColorPickerSwatchProps = Omit<ComponentProps<"span">, "color"> & {
  /** The color to show. Defaults to the picker's value, so it also works outside one. */
  color?: string | null
  /** `square` follows each style's radius; `circle` is round in all of them. */
  shape?: "square" | "circle"
}

/** A color chip: the value in a trigger, or any color in a table or a legend. */
export function ColorPickerSwatch({
  color: colorProp,
  shape = "square",
  className,
  style,
  ...props
}: ColorPickerSwatchProps) {
  const context = useContext(ColorPickerContext)
  const color =
    colorProp !== undefined ? parseColor(colorProp) : (context?.color ?? null)
  const labelled = !!props["aria-label"] || !!props["aria-labelledby"]
  return (
    <span
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      data-slot="color-picker-swatch"
      data-empty={color ? undefined : ""}
      className={cn(
        SWATCH_CLASS,
        shape === "circle" ? "rounded-full" : SWATCH_SQUARE,
        className
      )}
      style={{ background: swatchBackground(color), ...style }}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Triggers                                  */
/* -------------------------------------------------------------------------- */

const CHEVRON_ICON = (
  <ChevronDownIcon aria-hidden="true" />
)

export type ColorPickerValueProps = Omit<ComponentProps<"span">, "children"> & {
  placeholder?: ReactNode
}

/** The value as text, or the placeholder. For custom trigger content. */
export function ColorPickerValue({
  placeholder,
  className,
  ...props
}: ColorPickerValueProps) {
  const context = useColorPickerContext("ColorPickerValue")
  return (
    <span
      data-slot="color-picker-value"
      data-placeholder={context.color ? undefined : ""}
      className={cn("truncate", className)}
      {...props}
    >
      {context.text ?? placeholder ?? context.i18n.labels.placeholder}
    </span>
  )
}

/* `normal-case` and `tracking-normal` undo sera's uppercase button text: the
   trigger reads as a field, not an action. */
const TRIGGER_CLASS =
  "font-normal normal-case tracking-normal tabular-nums data-placeholder:text-muted-foreground"

export type ColorPickerTriggerProps = ComponentProps<typeof Button> & {
  placeholder?: ReactNode
}

/** A shadcn Button that opens the picker. Children replace the swatch, value and chevron. */
export function ColorPickerTrigger({
  className,
  variant = "outline",
  placeholder,
  children,
  ref,
  ...props
}: ColorPickerTriggerProps) {
  const context = useColorPickerContext("ColorPickerTrigger")
  const labelledBy = props["aria-labelledby"] ?? context.labelledBy
  const buttonProps = {
    variant,
    disabled: context.disabled,
    "aria-label": context.label,
    "aria-describedby": context.describedBy,
    ...(context.invalid && { "aria-invalid": true, "data-invalid": "" }),
    ...props,
    /* The label, then the button's own text: a label alone would replace the
       value, or whatever custom children show. */
    "aria-labelledby": labelledBy ? `${labelledBy} ${context.id}` : undefined,
    onKeyDown: (event: Parameters<NonNullable<typeof props.onKeyDown>>[0]) => {
      props.onKeyDown?.(event)
      if (!event.defaultPrevented) copyOnShortcut(event, context)
    },
    id: context.id,
    ref: (node: HTMLButtonElement | null) => {
      context.registerFocusTarget(node)
      assignRef(ref, node)
    },
    "data-slot": "color-picker-trigger",
    "data-placeholder": context.color ? undefined : "",
    className: cn(
      TRIGGER_CLASS,
      children === undefined && "justify-start",
      className
    ),
  }
  const content =
    children === undefined ? (
      <>
        <ColorPickerSwatch data-icon="inline-start" />
        <ColorPickerValue
          placeholder={placeholder}
          className="flex-1 text-start"
        />
        <span
          data-icon="inline-end"
          aria-hidden="true"
          className="text-muted-foreground flex"
        >
          {CHEVRON_ICON}
        </span>
      </>
    ) : (
      children
    )

  return (
    <PopoverTrigger id={context.id} render={<Button {...buttonProps} />}>
      {content}
    </PopoverTrigger>
  )
}

export type ColorPickerInputProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  "value" | "defaultValue"
>

/**
 * A typable field with a swatch button that opens the picker. It reads any
 * CSS color the browser knows, named colors included, on blur and Enter;
 * Escape restores the value and Alt+ArrowDown opens the popover.
 */
export function ColorPickerInput({
  className,
  placeholder,
  onBlur,
  onKeyDown,
  onChange,
  children,
  ref,
  ...props
}: ColorPickerInputProps) {
  const context = useColorPickerContext("ColorPickerInput")
  /* `null` while the field shows the value rather than an edit in progress. */
  const [text, setText] = useState<string | null>(null)
  const current = context.text ?? ""
  const shown = text ?? current
  const fieldRef = useRef<HTMLInputElement | null>(null)
  useEscapeRevert(fieldRef, text !== null, () => setText(null))

  const read = () => {
    if (text === null) return
    setText(null)
    if (text === current) return
    if (!text.trim()) return context.change(null)
    const typed = parseColor(text) ?? parseWithBrowser(text.trim())
    if (typed) context.change(typed)
  }

  const swatchProps = {
    size: "icon-xs" as const,
    disabled: context.disabled,
    "aria-label": context.i18n.labels.openPicker,
    "data-slot": "color-picker-input-trigger",
  }

  return (
    <InputGroup
      data-slot="color-picker-input"
      data-disabled={context.disabled ? "" : undefined}
      className={className}
    >
      <InputGroupAddon align="inline-start">
        <PopoverTrigger render={<InputGroupButton {...swatchProps} />}>
          <ColorPickerSwatch />
        </PopoverTrigger>
      </InputGroupAddon>
      <InputGroupInput
        value={shown}
        placeholder={placeholder ?? context.i18n.labels.placeholder}
        disabled={context.disabled}
        readOnly={context.readOnly}
        required={context.required}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-keyshortcuts="Alt+ArrowDown"
        aria-label={context.label}
        aria-labelledby={context.labelledBy}
        aria-describedby={context.describedBy}
        aria-invalid={context.invalid || undefined}
        className="tabular-nums"
        onChange={(event) => {
          onChange?.(event)
          setText(event.target.value)
        }}
        onBlur={(event) => {
          onBlur?.(event)
          read()
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || copyOnShortcut(event, context)) return
          if (event.key === "Enter") {
            /* Flushed, so an implicit form submit reads the new value. */
            flushSync(() => read())
          } else if (event.altKey && event.key === "ArrowDown") {
            event.preventDefault()
            read()
            context.setOpen(true)
          }
        }}
        {...props}
        id={context.id}
        ref={(node: HTMLInputElement | null) => {
          fieldRef.current = node
          context.registerFocusTarget(node)
          assignRef(ref, node)
        }}
      />
      {/* Extra addons, such as a clear button, after the field. */}
      {children}
    </InputGroup>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Panel                                   */
/* -------------------------------------------------------------------------- */

const TABBABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

export type ColorPickerContentProps = ComponentProps<typeof PopoverContent>

/**
 * The popover: the default panel unless given children. Tab cycles inside
 * it, as in a date picker dialog, in both twins.
 */
export function ColorPickerContent({
  className,
  align = "start",
  onKeyDown,
  children,
  ...props
}: ColorPickerContentProps) {
  const context = useColorPickerContext("ColorPickerContent")
  return (
    <PopoverContent
      align={align}
      aria-labelledby={context.labelledBy}
      aria-label={
        context.labelledBy
          ? undefined
          : (context.label ?? context.i18n.labels.panelLabel)
      }
      /* OKLCH with opacity needs the extra width for its four fields, and
         more below md, where the shadcn input's text grows to 16px so iOS
         does not zoom on focus. Capped to the viewport. A variable, not
         md:w-*, so one plain w-* in className wins at every breakpoint. */
      className={cn(
        "w-(--color-picker-content-width) max-w-[calc(100vw-1rem)]",
        context.alpha
          ? "[--color-picker-content-width:--spacing(96)] md:[--color-picker-content-width:--spacing(84)]"
          : "[--color-picker-content-width:--spacing(72)]",
        className
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || event.key !== "Tab") return
        if (event.altKey || event.ctrlKey || event.metaKey) return
        const items = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(TABBABLE)
        )
        const active = event.currentTarget.ownerDocument.activeElement
        const first = items[0]
        const last = items[items.length - 1]
        if (!event.shiftKey && active === last) {
          event.preventDefault()
          first?.focus()
        } else if (event.shiftKey && active === first) {
          event.preventDefault()
          last?.focus()
        }
      }}
      {...props}
    >
      <SurfaceContext.Provider value="popup">
        {children === undefined ? <ColorPickerPanel /> : children}
      </SurfaceContext.Provider>
    </PopoverContent>
  )
}

/* Bespoke spacing, a step tighter than each style's popover gap: the area,
   the sliders and the fields read as one control. */
const PANEL_CLASS =
  "flex w-full min-w-0 flex-col gap-3"

export type ColorPickerPanelProps = ComponentProps<"div">

/**
 * The area, the sliders, the fields and any `swatches`, rendered in place:
 * put it straight inside a `ColorPicker` for an always-open picker.
 */
export function ColorPickerPanel({
  className,
  children,
  ...props
}: ColorPickerPanelProps) {
  const context = useColorPickerContext("ColorPickerPanel")
  const inline = useContext(SurfaceContext) === "inline"
  return (
    <div
      role={inline ? "group" : undefined}
      aria-labelledby={inline ? context.labelledBy : undefined}
      aria-label={
        inline && !context.labelledBy
          ? (context.label ?? context.i18n.labels.panelLabel)
          : undefined
      }
      data-slot="color-picker-panel"
      data-disabled={context.disabled ? "" : undefined}
      className={cn(PANEL_CLASS, className)}
      {...props}
    >
      {children === undefined ? (
        <>
          <ColorPickerArea />
          <div className="flex items-center gap-3">
            <ColorPickerEyeDropper />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <ColorPickerSlider channel="hue" />
              {context.alpha && <ColorPickerSlider channel="alpha" />}
            </div>
            <ColorPickerCopy />
          </div>
          <ColorPickerFields />
          {context.swatches && context.swatches.length > 0 && (
            <ColorPickerSwatches colors={context.swatches} />
          )}
        </>
      ) : (
        children
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Controls                                  */
/* -------------------------------------------------------------------------- */

/* Cmd+C or Ctrl+C on a control with nothing selected copies the value in the
   format on screen. A selection in a field keeps the browser's own copy. */
function copyOnShortcut(
  event: ReactKeyboardEvent<HTMLElement>,
  context: ColorPickerContextValue
) {
  if (
    !(event.metaKey || event.ctrlKey) ||
    event.altKey ||
    event.shiftKey ||
    event.key.toLowerCase() !== "c" ||
    !context.color
  ) {
    return false
  }
  const target = event.target
  const selected =
    target instanceof HTMLInputElement
      ? target.selectionStart !== target.selectionEnd
      : !!event.currentTarget.ownerDocument.getSelection()?.toString()
  if (selected) return false
  event.preventDefault()
  context.copy()
  return true
}

/* While a field holds an edit, Escape puts the value back and stops there.
   Both popover libraries close on a document listener, which an element
   handler runs too late to stop, so this one listens on the window first. */
function useEscapeRevert(
  field: { current: HTMLElement | null },
  editing: boolean,
  revert: () => void
) {
  const revertRef = useRef(revert)
  useLayoutEffect(() => {
    revertRef.current = revert
  })
  useEffect(() => {
    const view = field.current?.ownerDocument.defaultView
    if (!editing || !view) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.target !== field.current) return
      event.preventDefault()
      event.stopPropagation()
      revertRef.current()
    }
    view.addEventListener("keydown", onKeyDown, true)
    return () => view.removeEventListener("keydown", onKeyDown, true)
  }, [editing, field])
}

/* Thumbs copy the shadcn Slider thumb in each style: its shape (round,
   squircle in mira, square in lyra and sera) and its keyboard ring, drawn on
   the thumb while its control has focus. */
const THUMB_CLASS =
  "pointer-events-none absolute size-(--color-picker-thumb-size) -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_1px_3px_rgb(0_0_0/0.3)] transition-[box-shadow] rounded-full ring-ring/50 group-focus-visible/color-picker-control:ring-4 forced-colors:outline-2 forced-colors:outline-solid"

/* A hairline inside the edge, so the white corner of the area and the light
   end of a track stay visible on a white surface. */
const EDGE_CLASS =
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:inset-ring after:inset-ring-foreground/10"

const CONTROL_CLASS =
  "group/color-picker-control relative outline-none [--color-picker-thumb-size:calc(var(--spacing)*4)] select-none aria-disabled:pointer-events-none aria-disabled:opacity-50 data-dragging:cursor-grabbing"

/* Where the pointer sits, 0 to 1 each way, over a travel `inset` pixels
   shorter than the element: a slider thumb stays inside its track. */
function pointerRatio(
  event: ReactPointerEvent<HTMLElement>,
  element: HTMLElement,
  inset = 0
) {
  const rect = element.getBoundingClientRect()
  const ratio = (offset: number, size: number) =>
    size > inset ? clamp((offset - inset / 2) / (size - inset), 0, 1) : 0
  return {
    x: ratio(event.clientX - rect.left, rect.width),
    y: ratio(event.clientY - rect.top, rect.height),
  }
}

/* A point along a slider's travel, inset by half a thumb at each end. */
const travel = (fraction: number) =>
  `calc(var(--color-picker-thumb-size) / 2 + (100% - var(--color-picker-thumb-size)) * ${fraction})`

/* Pointer drags shared by the area, the sliders and the wheel. The pointer is
   captured, so a drag carries on outside the control, and the browser's own
   mousedown focuses it, so a click never paints the keyboard ring. */
function useDrag(
  context: ColorPickerContextValue,
  update: (event: ReactPointerEvent<HTMLElement>, element: HTMLElement) => void
) {
  const pointer = useRef<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const end = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointer.current !== event.pointerId) return
    pointer.current = null
    setDragging(false)
    context.endInteraction()
  }
  return {
    dragging,
    handlers: {
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
        if (event.button !== 0 || !context.editable) return
        pointer.current = event.pointerId
        event.currentTarget.setPointerCapture?.(event.pointerId)
        setDragging(true)
        context.startInteraction()
        update(event, event.currentTarget)
      },
      onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
        if (pointer.current === event.pointerId) {
          update(event, event.currentTarget)
        }
      },
      onPointerUp: end,
      onPointerCancel: end,
    },
  }
}

/* Arrows move a step, ten with Shift; Page keys ten; Home and End the ends. */
function keyDelta(event: ReactKeyboardEvent, step: number) {
  const size = event.shiftKey ? step * 10 : step
  switch (event.key) {
    case "ArrowUp":
    case "ArrowRight":
      return size
    case "ArrowDown":
    case "ArrowLeft":
      return -size
    case "PageUp":
      return step * 10
    case "PageDown":
      return -step * 10
    case "Home":
      return -Infinity
    case "End":
      return Infinity
  }
  return null
}

const snap = (value: number, step: number) =>
  Number((Math.round(value / step) * step).toFixed(4))

/* Both ends of the area run 0 to 100: saturation across, brightness up. */
const AREA_CLASS =
  "forced-color-adjust-none h-40 w-full touch-none bg-[linear-gradient(to_top,#000,transparent),linear-gradient(to_right,#fff,transparent)] rounded-xl"

export type ColorPickerAreaProps = ComponentProps<"div">

/**
 * The saturation and brightness square, at the current hue. A single slider
 * to assistive tech, whose value text names both channels and the color.
 * Arrows move it, Shift by ten, Page keys move brightness.
 */
export function ColorPickerArea({
  className,
  style,
  onKeyDown,
  ...props
}: ColorPickerAreaProps) {
  const context = useColorPickerContext("ColorPickerArea")
  const { labels } = context.i18n
  const [hue, saturation, brightness] = toSpace(context.display, "hsv")
  const set = (s: number, v: number) => {
    const [h] = toSpace(context.getColor(), "hsv")
    context.emit({
      space: "hsv",
      channels: [h, clamp(s, 0, 100), clamp(v, 0, 100)],
      alpha: context.getColor().alpha,
    })
  }
  const { dragging, handlers } = useDrag(context, (event, element) => {
    const { x, y } = pointerRatio(event, element)
    set(x * 100, (1 - y) * 100)
  })

  return (
    <div
      id={`${context.id}-area`}
      role="slider"
      tabIndex={context.disabled ? -1 : 0}
      aria-label={labels.area}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(saturation)}
      aria-valuetext={`${labels.saturation} ${Math.round(saturation)}%, ${labels.brightness} ${Math.round(brightness)}%, ${context.i18n.functions.getColorName(context.display)}`}
      aria-disabled={context.disabled || undefined}
      aria-readonly={context.readOnly || undefined}
      dir="ltr"
      data-slot="color-picker-area"
      data-dragging={dragging ? "" : undefined}
      className={cn(CONTROL_CLASS, EDGE_CLASS, AREA_CLASS, className)}
      style={{ backgroundColor: `hsl(${hue} 100% 50%)`, ...style }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || copyOnShortcut(event, context)) return
        if (!context.editable) return
        const delta = keyDelta(event, 1)
        if (delta === null) return
        event.preventDefault()
        const vertical =
          event.key === "ArrowUp" ||
          event.key === "ArrowDown" ||
          event.key.startsWith("Page")
        context.startInteraction()
        /* Only the channel that moves is rounded to the step. */
        if (vertical) set(saturation, Math.round(brightness) + delta)
        else set(Math.round(saturation) + delta, brightness)
        context.endInteraction()
      }}
      {...handlers}
      {...props}
    >
      <div
        data-slot="color-picker-area-thumb"
        className={THUMB_CLASS}
        style={{ left: `${saturation}%`, top: `${100 - brightness}%` }}
      />
    </div>
  )
}

/* Track thickness is the primitive's own; the radius follows the shadcn
   Slider track in each style. Vertical tracks default to the area's height. */
/* A horizontal track fills its row and shrinks beside a sibling (an eye
   dropper); min-h-3 keeps its height in a column. A vertical one never shrinks.
   Every color surface opts out of forced colors, which would paint it over
   with a system color and drop its gradient: the color is the content. */
const SLIDER_CLASS =
  "forced-color-adjust-none data-[orientation=horizontal]:h-3 data-[orientation=horizontal]:min-h-3 data-[orientation=horizontal]:w-full data-[orientation=horizontal]:min-w-0 data-[orientation=horizontal]:touch-pan-y data-[orientation=vertical]:h-40 data-[orientation=vertical]:shrink-0 data-[orientation=vertical]:w-3 data-[orientation=vertical]:touch-pan-x rounded-full"

export type ColorPickerSliderProps = Omit<ComponentProps<"div">, "children"> & {
  channel: ColorPickerChannel
  /** The space the channel belongs to. Defaults to HSB for hue, saturation and brightness, HSL for lightness, OKLCH for chroma and RGB for red, green and blue. */
  colorSpace?: ColorPickerColorSpace
  orientation?: "horizontal" | "vertical"
}

/** One channel as a gradient track. Vertical tracks run bottom to top. */
export function ColorPickerSlider({
  channel,
  colorSpace,
  orientation = "horizontal",
  className,
  style,
  onKeyDown,
  ...props
}: ColorPickerSliderProps) {
  const context = useColorPickerContext("ColorPickerSlider")
  const space = resolveSpace(channel, colorSpace)
  const { max, step } = channelRange(space, channel)
  const precision = channel === "chroma" ? 0.001 : step
  const value = readChannel(context.display, space, channel)
  const vertical = orientation === "vertical"
  const set = (next: number) => {
    context.emit(
      withChannel(
        context.getColor(),
        space,
        channel,
        clamp(snap(next, precision), 0, max)
      )
    )
  }
  const { dragging, handlers } = useDrag(context, (event, element) => {
    const thumb = element.lastElementChild as HTMLElement | null
    const inset = (vertical ? thumb?.offsetHeight : thumb?.offsetWidth) ?? 0
    const { x, y } = pointerRatio(event, element, inset)
    set((vertical ? 1 - y : x) * max)
  })
  /* Stops follow the thumb's travel, so the color under its center is the
     value's own. */
  const colors = trackStops(context.display, space, channel)
  const stops = colors.map(
    (color, index) => `${color} ${travel(index / (colors.length - 1))}`
  )
  const gradient = `linear-gradient(${vertical ? "to top" : "to right"}, ${stops.join(", ")})`
  const fraction = clamp(value, 0, max) / max
  const scale = channel === "alpha" ? 100 : 1

  return (
    <div
      role="slider"
      tabIndex={context.disabled ? -1 : 0}
      aria-label={context.i18n.labels[channel]}
      aria-orientation={orientation}
      aria-valuemin={0}
      aria-valuemax={max * scale}
      aria-valuenow={Number((value * scale).toFixed(3))}
      aria-valuetext={channelValueText(
        context.display,
        space,
        channel,
        context.i18n
      )}
      aria-disabled={context.disabled || undefined}
      aria-readonly={context.readOnly || undefined}
      dir="ltr"
      data-slot="color-picker-slider"
      data-channel={channel}
      data-orientation={orientation}
      data-dragging={dragging ? "" : undefined}
      className={cn(CONTROL_CLASS, EDGE_CLASS, SLIDER_CLASS, className)}
      style={{
        background: channel === "alpha" ? `${gradient}, ${CHECKER}` : gradient,
        ...style,
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || copyOnShortcut(event, context)) return
        if (!context.editable) return
        const delta = keyDelta(event, step)
        if (delta === null) return
        event.preventDefault()
        context.startInteraction()
        set(snap(value, step) + delta)
        context.endInteraction()
      }}
      {...handlers}
      {...props}
    >
      <div
        data-slot="color-picker-slider-thumb"
        className={THUMB_CLASS}
        style={
          vertical
            ? { left: "50%", top: travel(1 - fraction) }
            : { left: travel(fraction), top: "50%" }
        }
      />
    </div>
  )
}

/* Hue 0 at the top, increasing clockwise, as a conic gradient starts. The
   ring is a masked layer of its own, so the thumb and its focus ring are
   never masked with it. */
const WHEEL_RING_CLASS =
  "forced-color-adjust-none pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] mask-[radial-gradient(farthest-side,transparent_calc(100%-var(--color-picker-wheel-thickness)),#000_calc(100%-var(--color-picker-wheel-thickness)+1px))]"

export type ColorPickerWheelProps = ComponentProps<"div">

/**
 * A hue ring. Children fill the square inscribed in its hole: an area there
 * gives the classic ring-and-square picker. `--color-picker-wheel-thickness`
 * sets the ring's width.
 */
export function ColorPickerWheel({
  className,
  children,
  onKeyDown,
  ...props
}: ColorPickerWheelProps) {
  const context = useColorPickerContext("ColorPickerWheel")
  const [hue] = toSpace(context.display, "hsv")
  const set = (next: number) => {
    context.emit(
      withChannel(context.getColor(), "hsv", "hue", wrapHue(Math.round(next)))
    )
  }
  const { dragging, handlers } = useDrag(context, (event, element) => {
    const rect = element.getBoundingClientRect()
    const x = event.clientX - rect.left - rect.width / 2
    const y = event.clientY - rect.top - rect.height / 2
    set((Math.atan2(x, -y) * 180) / Math.PI)
  })
  /* Only the ring starts a drag. The thumb rides the ring's middle, so the
     hole's edge is that radius times two, less the outer radius. */
  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const thumb = event.currentTarget
      .querySelector("[data-slot=color-picker-wheel-thumb]")
      ?.getBoundingClientRect()
    if (thumb) {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const middle = Math.hypot(
        thumb.left + thumb.width / 2 - centerX,
        thumb.top + thumb.height / 2 - centerY
      )
      const inner = 2 * middle - rect.width / 2
      const distance = Math.hypot(
        event.clientX - centerX,
        event.clientY - centerY
      )
      if (distance < inner - 2) return
    }
    handlers.onPointerDown(event)
  }
  const angle = (hue * Math.PI) / 180
  const radius = "(50% - var(--color-picker-wheel-thickness) / 2)"

  return (
    <div
      data-slot="color-picker-wheel"
      className={cn(
        "relative size-48 shrink-0 [--color-picker-wheel-thickness:calc(var(--spacing)*5)]",
        className
      )}
      {...props}
    >
      <div
        role="slider"
        tabIndex={context.disabled ? -1 : 0}
        aria-label={context.i18n.labels.hue}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hue)}
        aria-valuetext={channelValueText(
          context.display,
          "hsv",
          "hue",
          context.i18n
        )}
        aria-disabled={context.disabled || undefined}
        aria-readonly={context.readOnly || undefined}
        data-slot="color-picker-wheel-track"
        data-dragging={dragging ? "" : undefined}
        className={cn(
          CONTROL_CLASS,
          "absolute inset-0 touch-none rounded-full"
        )}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || copyOnShortcut(event, context)) return
          if (!context.editable) return
          const delta = keyDelta(event, 1)
          if (delta === null) return
          event.preventDefault()
          context.startInteraction()
          set(
            Number.isFinite(delta)
              ? Math.round(hue) + delta
              : delta > 0
                ? 359
                : 0
          )
          context.endInteraction()
        }}
        {...handlers}
        onPointerDown={onPointerDown}
      >
        <div className={WHEEL_RING_CLASS} />
        <div
          data-slot="color-picker-wheel-thumb"
          className={THUMB_CLASS}
          style={{
            left: `calc(50% + ${radius} * ${Math.sin(angle)})`,
            top: `calc(50% - ${radius} * ${Math.cos(angle)})`,
          }}
        />
      </div>
      {children !== undefined && (
        <div className="absolute inset-[calc(50%-(50%-var(--color-picker-wheel-thickness))*0.7071+var(--spacing)*1.5)] flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Actions                                  */
/* -------------------------------------------------------------------------- */

type EyeDropperConstructor = new () => {
  open: (options?: { signal?: AbortSignal }) => Promise<{ sRGBHex: string }>
}

const getEyeDropper = () =>
  (window as unknown as { EyeDropper?: EyeDropperConstructor }).EyeDropper

const noSubscribe = () => () => {}

export type ColorPickerActionProps = ComponentProps<typeof Button>

/**
 * Samples a color from anywhere on screen, keeping the current opacity.
 * Renders nothing where the browser has no EyeDropper (Firefox, Safari).
 */
export function ColorPickerEyeDropper({
  variant = "ghost",
  size = "icon-sm",
  onClick,
  children,
  ...props
}: ColorPickerActionProps) {
  const context = useColorPickerContext("ColorPickerEyeDropper")
  /* False on the server and in the first client render, so markup matches. */
  const supported = useSyncExternalStore(
    noSubscribe,
    () => !!getEyeDropper(),
    () => false
  )
  if (!supported) return null
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={!context.editable}
      aria-label={context.i18n.labels.eyeDropper}
      data-slot="color-picker-eye-dropper"
      onClick={async (event) => {
        onClick?.(event)
        const EyeDropper = getEyeDropper()
        if (event.defaultPrevented || !EyeDropper) return
        try {
          const { sRGBHex } = await new EyeDropper().open()
          const picked = parseColor(sRGBHex)
          if (picked) {
            context.change({ ...picked, alpha: context.getColor().alpha })
          }
        } catch {
          /* Escape cancels the sampler with an AbortError. */
        }
      }}
      {...props}
    >
      {children === undefined ? (
        <PipetteIcon aria-hidden="true" />
      ) : (
        children
      )}
    </Button>
  )
}

export type ColorPickerCopyProps = ColorPickerActionProps & {
  /** The format copied. Defaults to the picker's. */
  format?: ColorPickerFormat
}

/**
 * Copies the value and confirms for a moment, in `format` or, by default, the
 * format on screen: what the fields show, else the picker's.
 */
export function ColorPickerCopy({
  format,
  variant = "ghost",
  size = "icon-sm",
  onClick,
  children,
  ...props
}: ColorPickerCopyProps) {
  const context = useColorPickerContext("ColorPickerCopy")
  const target = format ?? context.shownFormat
  const copied = context.copied === target
  const { labels } = context.i18n
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={context.disabled || !context.color}
      aria-label={copied ? labels.copied : labels.copy}
      aria-keyshortcuts="Control+C Meta+C"
      data-slot="color-picker-copy"
      data-copied={copied ? "" : undefined}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context.copy(target)
      }}
      {...props}
    >
      {children === undefined ? (
        copied ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <CopyIcon aria-hidden="true" />
        )
      ) : (
        children
      )}
    </Button>
  )
}

/**
 * Empties the value, for an optional color. It stays enabled while empty:
 * disabling itself on click would drop keyboard focus to the page.
 */
export function ColorPickerClear({
  variant = "ghost",
  size = "sm",
  onClick,
  children,
  ...props
}: ColorPickerActionProps) {
  const context = useColorPickerContext("ColorPickerClear")
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={!context.editable}
      data-slot="color-picker-clear"
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context.change(null)
      }}
      {...props}
    >
      {children === undefined ? context.i18n.labels.clear : children}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Fields                                   */
/* -------------------------------------------------------------------------- */

type FieldChannel = ColorPickerChannel | "hex"

const FORMAT_FIELDS: Record<
  ColorPickerFormat,
  { space: ColorPickerColorSpace; channels: FieldChannel[] }
> = {
  hex: { space: "rgb", channels: ["hex"] },
  rgb: { space: "rgb", channels: ["red", "green", "blue"] },
  hsl: { space: "hsl", channels: ["hue", "saturation", "lightness"] },
  hsb: { space: "hsv", channels: ["hue", "saturation", "brightness"] },
  oklch: { space: "oklch", channels: ["lightness", "chroma", "hue"] },
}

function channelText(
  color: ColorPickerColor,
  space: ColorPickerColorSpace,
  channel: FieldChannel
) {
  if (channel === "hex") {
    return formatColor({ ...color, alpha: 1 }, "hex")
      .slice(1)
      .toUpperCase()
  }
  if (channel === "alpha") return `${Math.round(color.alpha * 100)}%`
  const value = readChannel(color, space, channel)
  if (channel === "chroma") return fixed(value, 3)
  return space === "oklch" ? fixed(value, 1) : String(Math.round(value))
}

const FIELD_NUMBER =
  /^([+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+))\s*(%|°|deg|grad|rad|turn)?$/

/* A typed channel. Hex keeps the current opacity unless it carries its own.
   A number takes a comma decimal; % is a share of the channel's range, as in
   CSS (50% red is 127.5, 50% chroma 0.2), and a hue takes an angle unit and
   wraps, so -30 is 330. Anything else is rejected. */
function readChannelText(
  text: string,
  color: ColorPickerColor,
  space: ColorPickerColorSpace,
  channel: FieldChannel
): ColorPickerColor | null {
  if (channel === "hex") {
    const digits = text.trim().replace(/^#/, "")
    const parsed = /^[\da-f]+$/i.test(digits) ? parseColor(digits) : null
    if (!parsed) return null
    return digits.length === 4 || digits.length === 8
      ? parsed
      : { ...parsed, alpha: color.alpha }
  }
  const match = FIELD_NUMBER.exec(text.trim().toLowerCase())
  if (!match) return null
  const value = Number(match[1].replace(",", "."))
  const unit = match[2]
  if (!Number.isFinite(value)) return null
  if (channel === "hue") {
    if (unit === "%") return null
    const degrees =
      unit === "rad"
        ? (value * 180) / Math.PI
        : unit === "grad"
          ? value * 0.9
          : unit === "turn"
            ? value * 360
            : value
    return withChannel(color, space, channel, wrapHue(degrees))
  }
  if (unit && unit !== "%") return null
  if (channel === "alpha") return { ...color, alpha: clamp(value / 100, 0, 1) }
  const { max } = channelRange(space, channel)
  const scaled = unit === "%" ? (value * max) / 100 : value
  return withChannel(color, space, channel, clamp(scaled, 0, max))
}

export type ColorPickerChannelInputProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  "value" | "defaultValue"
> & {
  /** A channel, or `"hex"` for the six hex digits. */
  channel: FieldChannel
  colorSpace?: ColorPickerColorSpace
}

/**
 * One channel as a borderless field for an `InputGroup`. Text is read on blur
 * and Enter; ArrowUp and ArrowDown step it, Shift by ten.
 */
export function ColorPickerChannelInput({
  channel,
  colorSpace,
  className,
  onBlur,
  onKeyDown,
  onChange,
  ref,
  ...props
}: ColorPickerChannelInputProps) {
  const context = useColorPickerContext("ColorPickerChannelInput")
  const space = channel === "hex" ? "rgb" : resolveSpace(channel, colorSpace)
  const [text, setText] = useState<string | null>(null)
  /* Empty stays blank: `display` falls back to white, which is not a value. */
  const current = context.color
    ? channelText(context.display, space, channel)
    : ""
  const shown = text ?? current
  const fieldRef = useRef<HTMLInputElement | null>(null)
  useEscapeRevert(fieldRef, text !== null, () => setText(null))
  const { max } = channelRange(space, channel === "hex" ? "red" : channel)
  /* A number field is a spin button: a screen reader hears its range. */
  const spin =
    channel === "hex"
      ? {}
      : {
          role: "spinbutton",
          "aria-valuemin": 0,
          "aria-valuemax": channel === "alpha" ? 100 : max,
          "aria-valuenow":
            channel === "alpha"
              ? Math.round(context.display.alpha * 100)
              : Number(channelText(context.display, space, channel)),
          "aria-valuetext": shown,
        }

  const read = () => {
    if (text === null) return
    setText(null)
    if (text === current) return
    const next = readChannelText(text, context.display, space, channel)
    if (next) context.change(next)
  }

  return (
    <InputGroupInput
      value={shown}
      inputMode={channel === "hex" ? "text" : "decimal"}
      maxLength={channel === "hex" ? 9 : 8}
      disabled={context.disabled}
      readOnly={context.readOnly}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      aria-label={context.i18n.labels[channel]}
      {...spin}
      data-channel={channel}
      className={cn(
        "h-auto min-w-0 self-stretch pr-1 pl-2 tabular-nums",
        /* Each field starts at its widest value plus padding, in ch so it
           tracks the font, where a tabular digit measures 1.03ch: 255 or 360,
           99.9 for OKLCH lightness, 0.399, 359.9, 100% and six hex digits. A
           short row shrinks every field in proportion. Equal shares clipped
           100% and every OKLCH channel. Text sits left, so the right padding
           is only the gap before the next separator. */
        channel === "hex"
          ? "flex-[1_1_calc(5.8ch+0.75rem)] uppercase"
          : channel === "alpha"
            ? "flex-[1_1_calc(4.8ch+0.75rem)]"
            : space !== "oklch"
              ? "flex-[1_1_calc(3.25ch+0.75rem)]"
              : channel === "lightness"
                ? "flex-[1_1_calc(3.7ch+0.75rem)]"
                : "flex-[1_1_calc(4.7ch+0.75rem)]",
        className
      )}
      onChange={(event) => {
        onChange?.(event)
        setText(event.target.value)
      }}
      onBlur={(event) => {
        onBlur?.(event)
        read()
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || copyOnShortcut(event, context)) return
        const step = STEP_KEYS[event.key]
        if (event.key === "Enter") {
          /* Flushed, so an implicit form submit reads the new value. */
          flushSync(() => read())
        } else if (step && channel !== "hex" && context.editable) {
          event.preventDefault()
          const from = readChannelText(shown, context.display, space, channel)
          if (!from) return
          const unit =
            channel === "alpha" ? 0.01 : channel === "chroma" ? 0.001 : 1
          const delta = step * unit * (event.shiftKey ? 10 : 1)
          const { max: top } = channelRange(space, channel)
          const next = snap(readChannel(from, space, channel) + delta, unit)
          setText(null)
          context.change(
            withChannel(
              from,
              space,
              channel,
              channel === "hue" ? wrapHue(next) : clamp(next, 0, top)
            )
          )
        }
      }}
      {...props}
      ref={(node: HTMLInputElement | null) => {
        fieldRef.current = node
        assignRef(ref, node)
      }}
    />
  )
}

/* Arrows step a field, ten with Shift; Page keys always ten. A hue wraps. */
const STEP_KEYS: Record<string, number> = {
  ArrowUp: 1,
  ArrowDown: -1,
  PageUp: 10,
  PageDown: -10,
}

/* Full height, so the fields read as cells of one control. */
const DIVIDER = <Separator orientation="vertical" aria-hidden="true" />

/* The shadcn inline-start addon insets its button on the left only (padding
   less a pull-in), so the format button met the first divider. Each rung
   repeats that inset on the right. maia and luma take 5px a side, concentric
   with the pill: 8px a side clipped OKLCH in the popover on a phone. */
const FORMAT_ADDON_CLASS =
  "pr-1.25 pl-2.25"

export type ColorPickerFieldsProps = Omit<
  ComponentProps<typeof InputGroup>,
  "children"
> & {
  /** The format shown, controlled. It does not change what `onValueChange` emits. */
  format?: ColorPickerFormat
  /** Defaults to the picker's `format`. */
  defaultFormat?: ColorPickerFormat
  onFormatChange?: (format: ColorPickerFormat) => void
  /** The formats in the menu. One format hides the menu. */
  formats?: ColorPickerFormat[]
}

/**
 * A format menu and the value's channels as joined fields: one hex field, or
 * three channels, plus opacity when the picker takes alpha.
 */
export function ColorPickerFields({
  format: formatProp,
  defaultFormat,
  onFormatChange,
  formats = COLOR_PICKER_FORMATS,
  className,
  ...props
}: ColorPickerFieldsProps) {
  const context = useColorPickerContext("ColorPickerFields")
  const [formatState, setFormatState] = useState(
    defaultFormat ?? context.format
  )
  const shown = formatProp ?? formatState
  const fields = FORMAT_FIELDS[shown]
  const { setFieldsFormat } = context
  useLayoutEffect(() => {
    setFieldsFormat(shown)
    return () => setFieldsFormat(null)
  }, [shown, setFieldsFormat])
  const menu = formats.length > 1
  const setFormat = (next: ColorPickerFormat) => {
    if (formatProp === undefined) setFormatState(next)
    onFormatChange?.(next)
  }
  const menuProps = {
    size: "xs" as const,
    disabled: context.disabled,
    "aria-label": `${context.i18n.labels.format}, ${FORMAT_LABELS[shown]}`,
    "data-slot": "color-picker-format-trigger",
    className: "gap-1 text-xs font-medium",
  }

  return (
    <InputGroup
      dir="ltr"
      data-slot="color-picker-fields"
      data-disabled={context.disabled ? "" : undefined}
      className={className}
      {...props}
    >
      {menu && (
        <InputGroupAddon align="inline-start" className={FORMAT_ADDON_CLASS}>
          <DropdownMenu>
            <DropdownMenuTrigger render={<InputGroupButton {...menuProps} />}>
              {FORMAT_LABELS[shown]}
              {CHEVRON_ICON}
            </DropdownMenuTrigger>
            {/* A pick's click bubbles through the portal to InputGroupAddon,
                whose own handler would move focus into a field. */}
            <DropdownMenuContent
              align="start"
              className="w-auto min-w-56"
              onClick={(event) => event.stopPropagation()}
            >
              <DropdownMenuRadioGroup
                value={shown}
                onValueChange={(next) => setFormat(next as ColorPickerFormat)}
              >
                {formats.map((item) => (
                  <DropdownMenuRadioItem key={item} value={item} closeOnClick>
                    <span className="w-12 shrink-0 font-medium">
                      {FORMAT_LABELS[item]}
                    </span>
                    <span className="text-muted-foreground truncate text-xs tabular-nums">
                      {formatColor(context.display, item).replace(
                        /^\w+\(|\)$/g,
                        ""
                      )}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </InputGroupAddon>
      )}
      <div className="flex min-w-0 flex-1 self-stretch">
        {fields.channels.map((channel, index) => (
          <Fragment key={`${shown}-${channel}`}>
            {(menu || index > 0) && DIVIDER}
            <ColorPickerChannelInput
              channel={channel}
              colorSpace={fields.space}
            />
          </Fragment>
        ))}
        {/* Opacity keeps its own width at the end: hex, or the channels,
            take the rest of the row. */}
        {context.alpha && (
          <>
            {DIVIDER}
            <ColorPickerChannelInput
              channel="alpha"
              className="w-[calc(4.8ch+0.75rem)] flex-none"
            />
          </>
        )}
      </div>
    </InputGroup>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Swatches                                  */
/* -------------------------------------------------------------------------- */

type SwatchesContextValue = {
  shape: "square" | "circle"
  activeId: string | null
  setActiveId: (id: string | null) => void
}

const SwatchesContext = createContext<SwatchesContextValue>({
  shape: "square",
  activeId: null,
  setActiveId: () => {},
})

export type ColorPickerSwatchInput = string | { value: string; label?: string }

const OPTION_SELECTOR =
  '[data-slot="color-picker-swatch-item"]:not([aria-disabled="true"])'

/* Arrows move to the previous or next swatch in order, mirrored right to
   left, and Home and End to the ends: the listbox model, row or wrapped. */
function neighbor(
  options: HTMLElement[],
  current: HTMLElement | undefined,
  key: string,
  rtl: boolean
) {
  if (key === "Home") return options[0]
  if (key === "End") return options[options.length - 1]
  if (!current) return options[0]
  const forward =
    key === "ArrowDown" || key === (rtl ? "ArrowLeft" : "ArrowRight")
  return options[options.indexOf(current) + (forward ? 1 : -1)]
}

export type ColorPickerSwatchesProps = Omit<
  ComponentProps<"div">,
  "children"
> & {
  colors?: ColorPickerSwatchInput[]
  shape?: "square" | "circle"
  children?: ReactNode
}

/**
 * Preset colors as a listbox: one tab stop, arrow keys move through them in
 * order, Enter or Space picks. `--color-picker-swatch-size` sets the chip size.
 */
export function ColorPickerSwatches({
  colors,
  shape = "square",
  className,
  children,
  onKeyDown,
  onFocus,
  ...props
}: ColorPickerSwatchesProps) {
  const context = useColorPickerContext("ColorPickerSwatches")
  const [activeId, setActiveId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const options = () =>
    Array.from(
      listRef.current?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? []
    )
  const activate = (option: HTMLElement | undefined) => {
    if (!option) return
    setActiveId(option.id)
    option.scrollIntoView?.({ block: "nearest" })
  }

  return (
    <SwatchesContext.Provider value={{ shape, activeId, setActiveId }}>
      <div
        ref={listRef}
        role="listbox"
        tabIndex={context.disabled ? -1 : 0}
        aria-label={context.i18n.labels.swatches}
        aria-activedescendant={activeId ?? undefined}
        aria-disabled={context.disabled || undefined}
        aria-readonly={context.readOnly || undefined}
        data-slot="color-picker-swatches"
        data-empty={activeId ? undefined : ""}
        className={cn(
          "group/color-picker-swatches data-empty:focus-visible:outline-ring grid grid-cols-[repeat(auto-fill,var(--color-picker-swatch-size))] justify-between gap-x-1 gap-y-1.5 outline-none [--color-picker-swatch-size:calc(var(--spacing)*6)] aria-disabled:opacity-50 data-empty:focus-visible:outline-2 data-empty:focus-visible:outline-offset-2",
          className
        )}
        onFocus={(event) => {
          onFocus?.(event)
          if (event.target !== event.currentTarget) return
          const found = activeId
            ? event.currentTarget.ownerDocument.getElementById(activeId)
            : null
          if (!found) {
            const selected = event.currentTarget.querySelector<HTMLElement>(
              `${OPTION_SELECTOR}[aria-selected="true"]`
            )
            setActiveId(selected?.id ?? null)
          }
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || copyOnShortcut(event, context)) return
          if (context.disabled) return
          const list = options()
          const current = list.find((option) => option.id === activeId)
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            current?.click()
            return
          }
          if (
            ![
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "Home",
              "End",
            ].includes(event.key)
          ) {
            return
          }
          event.preventDefault()
          const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
          activate(neighbor(list, current, event.key, rtl) ?? current)
        }}
        {...props}
      >
        {children ??
          colors?.map((item, index) => {
            const swatch = typeof item === "string" ? { value: item } : item
            return (
              <ColorPickerSwatchItem
                key={`${index}-${swatch.value}`}
                value={swatch.value}
                label={swatch.label}
              />
            )
          })}
      </div>
    </SwatchesContext.Provider>
  )
}

/* A 24px chip takes the shadcn Select item's radius, square in lyra and sera.
   The keyboard ring is an offset outline, so it never sits on the color. */
const SWATCH_ITEM_SQUARE =
  "rounded-lg"

const SWATCH_ITEM_CLASS =
  "forced-color-adjust-none relative flex size-(--color-picker-swatch-size) shrink-0 cursor-default items-center justify-center outline-offset-2 transition-[scale] duration-150 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:inset-ring after:inset-ring-foreground/10 not-aria-disabled:hover:scale-110 aria-disabled:opacity-40 motion-reduce:transition-none group-focus-visible/color-picker-swatches:data-active:outline-2 group-focus-visible/color-picker-swatches:data-active:outline-ring [&_svg]:size-3.5"

export type ColorPickerSwatchItemProps = Omit<
  ComponentProps<"div">,
  "children"
> & {
  /** Any color `parseColor` reads. */
  value: string
  /** Read out instead of the generated color name. */
  label?: string
  disabled?: boolean
}

/** One preset. Selected while the picker's value is this color. */
export function ColorPickerSwatchItem({
  value,
  label,
  disabled = false,
  className,
  style,
  onClick,
  ...props
}: ColorPickerSwatchItemProps) {
  const context = useColorPickerContext("ColorPickerSwatchItem")
  const swatches = useContext(SwatchesContext)
  const id = useId()
  const parsed = parseColor(value)
  const color = parsed && !context.alpha ? { ...parsed, alpha: 1 } : parsed
  const selected =
    !!color &&
    !!context.color &&
    formatColor(color, "hex") === formatColor(context.color, "hex")
  /* The check reads like text on the swatch: one rule for both. */
  const check =
    (color && getForegroundColor(color, { light: "#fff", dark: "#000" })) ??
    "#000"
  const inactive = disabled || !color

  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      aria-disabled={inactive || undefined}
      aria-label={
        label ?? (color ? context.i18n.functions.getColorName(color) : value)
      }
      data-slot="color-picker-swatch-item"
      data-active={swatches.activeId === id ? "" : undefined}
      data-selected={selected ? "" : undefined}
      className={cn(
        SWATCH_ITEM_CLASS,
        swatches.shape === "circle" ? "rounded-full" : SWATCH_ITEM_SQUARE,
        className
      )}
      style={{ background: swatchBackground(color), color: check, ...style }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || inactive || !context.editable) return
        swatches.setActiveId(id)
        context.change(color)
      }}
      {...props}
    >
      {selected && (
        <CheckIcon aria-hidden="true" />
      )}
    </div>
  )
}