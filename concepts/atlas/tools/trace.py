"""Traces the plate's outlines below the Earth, each at its true size, and writes
assets/ground.js and assets/small.js.

    python tools/trace.py <source dir> [--preview <dir>]

The source dir holds:
  osm/city.json, osm/mall.json, osm/garden.json
      OpenStreetMap extracts (Overpass API, `out tags geom`: ways and nodes), ODbL.
  osm/dc.json, osm/water-rel.json, osm/mall-rel.json
      the relations of the same areas with their members (`out geom`): the District's
      boundary, the rivers, and the multipolygon buildings and gardens.
  small/maple-tree-lite.sog, small/ribosome.vol.gz, small/ribosome-model.bin
      from the splashery repository (assets/toys/maple-tree, assets/toys/cryoem-map).
  small/leaf.jpg, small/cells.jpg, small/chloroplast.jpg
      the pictures Splashery's Powers of ten uses (src/powers/stops.js, MICRO).

Every coordinate is in meters from the point the zoom closes on (x east or right,
y north or up), stored as whole numbers of `unit` meters.
"""

import gzip
import io
import json
import math
import struct
import sys
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import filters, measure, morphology

SRC = Path(sys.argv[1])
PREVIEW = Path(sys.argv[sys.argv.index("--preview") + 1]) if "--preview" in sys.argv else None
OUT = Path(__file__).resolve().parent.parent / "assets"

# The zoom's target (splashery, src/powers/stops.js): a small tree in the Enid A. Haupt Garden.
LAT0, LON0 = 38.888321, -77.025649
PHI = math.radians(LAT0)
M_LAT = 111132.92 - 559.82 * math.cos(2 * PHI) + 1.175 * math.cos(4 * PHI)
M_LON = 111412.84 * math.cos(PHI) - 93.5 * math.cos(3 * PHI)


def local(lat, lon):
    return ((lon - LON0) * M_LON, (lat - LAT0) * M_LAT)


def simplify(points, tolerance):
    pts = np.asarray(points, dtype=float)
    if len(pts) < 3:
        return pts
    return measure.approximate_polygon(pts, tolerance)


def pack(lines, unit, tolerance, min_points=2, min_span=0.0):
    """Polylines in meters to flat lists of whole units, simplified."""
    out = []
    for line in lines:
        pts = simplify(line, tolerance)
        if len(pts) < min_points:
            continue
        if min_span and np.ptp(pts, axis=0).max() < min_span:
            continue
        q = np.round(pts / unit).astype(int)
        keep = [q[0]]
        for p in q[1:]:
            if (p != keep[-1]).any():
                keep.append(p)
        if len(keep) >= 2:
            out.append([int(v) for p in keep for v in p])
    return out


def count(groups):
    return sum(len(run) // 2 for lines in groups.values() for run in lines)


# ---- The ground: OpenStreetMap ---------------------------------------------------------------


def runs_of(geometry):
    """A way's geometry as runs of local points, split where the extract cut it."""
    run, runs = [], []
    for g in geometry or []:
        if g is None:
            if len(run) > 1:
                runs.append(run)
            run = []
        else:
            run.append(local(g["lat"], g["lon"]))
    if len(run) > 1:
        runs.append(run)
    return runs


def lines_of(el, roles=("outer", "inner", "")):
    if el["type"] == "way":
        return runs_of(el.get("geometry"))
    out = []
    for m in el.get("members", []):
        if m["type"] == "way" and m.get("role", "") in roles:
            out += runs_of(m.get("geometry"))
    return out


def area(run):
    p = np.asarray(run)
    return abs(float(np.dot(p[:, 0], np.roll(p[:, 1], -1)) - np.dot(p[:, 1], np.roll(p[:, 0], -1)))) / 2


def middle(el):
    pts = np.asarray([p for run in lines_of(el) for p in run])
    return (pts.min(axis=0) + pts.max(axis=0)) / 2


def clip(lines, radius):
    """Keeps the parts of each line within `radius` meters of the target."""
    out = []
    for line in lines:
        run = []
        for p in line:
            if abs(p[0]) <= radius and abs(p[1]) <= radius:
                run.append(p)
            else:
                if len(run) > 1:
                    out.append(run)
                run = []
        if len(run) > 1:
            out.append(run)
    return out


def load(*names):
    """The elements of several extracts. A relation fetched without its members (the
    `out tags geom` extracts) is dropped: the `out geom` extracts carry it whole."""
    els = []
    for name in names:
        for el in json.loads((SRC / "osm" / f"{name}.json").read_text())["elements"]:
            if el["type"] == "relation" and not el.get("members"):
                continue
            els.append(el)
    return els


def ground():
    facts = {}
    city = load("city", "dc", "water-rel")
    mall = load("mall", "mall-rel")
    garden = load("garden", "mall-rel")

    def tag(el, key):
        return el.get("tags", {}).get(key)

    # -- The city: the District's boundary, its rivers, its motorways.
    boundary = [el for el in city if tag(el, "boundary") == "administrative" and tag(el, "name") == "District of Columbia"]
    boundary.sort(key=lambda el: tag(el, "admin_level") or "9")
    district = lines_of(boundary[0], roles=("outer",))
    pts = np.asarray([p for run in district for p in run])
    north, east, south = pts[pts[:, 1].argmax()], pts[pts[:, 0].argmax()], pts[pts[:, 1].argmin()]
    facts["districtSideKm"] = [round(float(np.hypot(*(north - east))) / 1000, 2), round(float(np.hypot(*(east - south))) / 1000, 2)]
    facts["districtNorthSouthKm"] = round(float(north[1] - south[1]) / 1000, 2)
    rivers = []
    for el in city:
        if tag(el, "natural") != "water":
            continue
        runs = lines_of(el)
        if not runs:
            continue
        allp = np.asarray([p for run in runs for p in run])
        if np.ptp(allp, axis=0).max() >= 500 or tag(el, "name") in ("Tidal Basin", "Washington Channel"):
            rivers += runs
    motorways = [run for el in city if tag(el, "highway") == "motorway" for run in lines_of(el)]
    city_out = {
        "unit": 5,
        "lines": {
            "boundary": pack(district, 5, 12),
            "water": pack(rivers, 5, 14, min_span=150),
            "roads": pack(motorways, 5, 20, min_span=300),
        },
        "labels": [],
    }

    # -- The Mall: water, the large buildings, the main streets.
    R = 3600
    landmark = {
        "United States Capitol": "the Capitol",
        "Lincoln Memorial": "Lincoln Memorial",
        "Washington Monument": "Washington Monument",
        "White House": "the White House",
        "Thomas Jefferson Memorial": "Jefferson Memorial",
        "Smithsonian Institution Building": "Smithsonian Castle",
    }
    buildings, labels, centers = [], [], {}
    for el in mall:
        if not tag(el, "building"):
            continue
        runs = lines_of(el)
        if not runs:
            continue
        name = tag(el, "name")
        big = max((area(r) for r in runs if len(r) > 3), default=0)
        if name in landmark and name not in centers and big > 150:
            centers[name] = middle(el)
            labels.append([float(centers[name][0]), float(centers[name][1]), landmark[name]])
        if big >= 2200 or name in landmark:
            buildings += runs
    for name in landmark:
        if name not in centers:
            print("  (no footprint named", name + ")")
    a, b = centers["Lincoln Memorial"], centers["United States Capitol"]
    facts["capitolToLincolnKm"] = round(float(np.hypot(*(a - b))) / 1000, 2)
    mall_measure = [round(float(v), 1) for v in (*a, *b)]
    water = [run for el in mall if tag(el, "natural") == "water" for run in lines_of(el) if len(run) > 3 and area(run) > 400]
    for el in mall:
        if tag(el, "natural") == "water" and tag(el, "name") in ("Tidal Basin", "Lincoln Memorial Reflecting Pool") and tag(el, "name") not in centers:
            centers[tag(el, "name")] = middle(el)
            labels.append([float(centers[tag(el, "name")][0]), float(centers[tag(el, "name")][1]), "Tidal Basin" if tag(el, "name") == "Tidal Basin" else "Reflecting Pool"])
    water += clip(rivers, R)
    streets = [run for el in mall if tag(el, "highway") in ("motorway", "trunk", "primary", "secondary") and tag(el, "tunnel") != "yes" for run in lines_of(el)]
    lawn = [run for el in mall if tag(el, "name") == "National Mall" and tag(el, "leisure") == "park" for run in lines_of(el)]
    mall_out = {
        "unit": 0.5,
        "lines": {
            "water": pack(clip(water, R), 0.5, 2.5, min_span=30),
            "buildings": pack(clip(buildings, R), 0.5, 1.6, min_points=4),
            "roads": pack(clip(streets, R), 0.5, 4, min_span=60),
            "park": pack(lawn, 0.5, 2),
        },
        "labels": [[round(x), round(y), t] for x, y, t in labels],
        "measure": mall_measure,
    }

    # -- The garden: every footprint, path, hedge, bed and tree within reach of the target.
    G = 235
    groups = {k: [] for k in ("buildings", "paths", "roads", "edges", "beds", "water", "haupt")}
    trees, glabels = [], []
    named = {
        "Smithsonian Institution Building": "Smithsonian Castle",
        "National Museum of Asian Art": "Museum of Asian Art",
        "National Museum of African Art": "Museum of African Art",
        "Ripley Pavilion": "Ripley Pavilion",
    }
    seen = set()
    for el in garden:
        t = el.get("tags", {})
        if el["type"] == "node":
            if t.get("natural") == "tree":
                trees.append(local(el["lat"], el["lon"]))
            continue
        if t.get("tunnel") == "yes" or t.get("highway") == "corridor" or t.get("railway") or t.get("layer", "0").startswith("-"):
            continue
        runs = lines_of(el)
        if not runs:
            continue
        name = t.get("name")
        if name == "Enid A. Haupt Garden":
            groups["haupt"] += lines_of(el, roles=("outer",))
            ring = np.asarray([p for run in lines_of(el, roles=("outer",)) for p in run])
            facts["hauptSpanM"] = [round(float(v), 1) for v in np.ptp(ring, axis=0)]
            closed = [r for r in lines_of(el, roles=("outer",)) if len(r) > 3]
            facts["hauptAreaM2"] = round(sum(area(r) for r in closed)) if closed else None
            continue
        if t.get("building") and el["type"] in ("way", "relation") and t.get("building") != "roof":
            groups["buildings"] += runs
            if name in named and name not in seen:
                seen.add(name)
                c = middle(el)
                glabels.append([round(float(c[0]), 1), round(float(c[1]), 1), named[name]])
        elif t.get("highway") in ("footway", "path", "pedestrian", "steps", "service", "cycleway"):
            groups["paths"] += runs
        elif t.get("highway") in ("tertiary", "secondary", "primary", "residential", "unclassified"):
            groups["roads"] += runs
        elif t.get("barrier") in ("hedge", "wall", "retaining_wall", "fence"):
            groups["edges"] += runs
        elif t.get("leisure") == "garden" or t.get("landuse") in ("grass", "flowerbed"):
            groups["beds"] += runs
        elif t.get("natural") == "water" or t.get("amenity") == "fountain":
            groups["water"] += runs
    garden_out = {
        "unit": 0.05,
        "lines": {k: pack(clip(v, G), 0.05, 0.22 if k != "paths" else 0.35) for k, v in groups.items()},
        "trees": [int(round(v / 0.05)) for p in trees if abs(p[0]) <= G and abs(p[1]) <= G for v in p],
        "labels": glabels,
    }
    out = {"city": city_out, "mall": mall_out, "garden": garden_out, "facts": facts}
    for k in ("city", "mall", "garden"):
        print(f"  {k}: {count(out[k]['lines'])} points", {g: len(v) for g, v in out[k]["lines"].items()})
    print("  facts", facts)
    return out


# ---- The small: a capture, four pictures and a cryo-EM map -----------------------------------


def contours(field, level, scale, origin, min_len=12, tolerance=0.8):
    """Iso-lines of a 2D field as polylines in meters: x right, y up from `origin` (col, row)."""
    out = []
    for c in measure.find_contours(field, level):
        if len(c) < min_len:
            continue
        c = measure.approximate_polygon(c, tolerance)
        out.append(np.column_stack([(c[:, 1] - origin[0]) * scale, -(c[:, 0] - origin[1]) * scale]))
    return out


def picture(name, shrink=1):
    im = Image.open(SRC / "small" / name).convert("RGB")
    if shrink > 1:
        im = im.resize((im.width // shrink, im.height // shrink), Image.LANCZOS)
    return np.asarray(im).astype(float) / 255


def bed():
    """The garden bed: Splashery's capture of a golden full-moon maple, seen from above, as
    contour lines of its height. Scaled as Splashery scales it: its long side is 2 m."""
    z = zipfile.ZipFile(SRC / "small" / "maple-tree-lite.sog")
    meta = json.loads(z.read("meta.json"))
    img = lambda f: np.asarray(Image.open(io.BytesIO(z.read(f))).convert("RGBA")).reshape(-1, 4)[: meta["count"]].astype(np.int64)
    ml, mu = (img(f) for f in meta["means"]["files"])
    s0 = img(meta["sh0"]["files"][0])
    mins, maxs = np.asarray(meta["means"]["mins"]), np.asarray(meta["means"]["maxs"])
    t = ((mu[:, :3] << 8) + ml[:, :3]) / 65535
    v = mins + (maxs - mins) * t
    pos = np.sign(v) * (np.exp(np.abs(v)) - 1)
    alpha = s0[:, 3] / 255
    solid = pos[alpha >= 0.3]
    lo, hi = solid.min(axis=0), solid.max(axis=0)
    span = max(hi[0] - lo[0], hi[2] - lo[2])
    k = 2.0 / span  # meters per unit of the capture
    crown = solid[solid[:, 1] >= lo[1] + (hi[1] - lo[1]) * 0.66]
    cx, cz = np.median(crown[:, 0]), np.median(crown[:, 2])
    # From above: x right, up on the page is -z (Splashery turns it +90 degrees about x).
    x = (solid[:, 0] - cx) * k
    y = -(solid[:, 2] - cz) * k
    h = (solid[:, 1] - lo[1]) * k
    cell = 0.008
    half = 1.5
    n = int(2 * half / cell)
    col = ((x + half) / cell).astype(int)
    row = ((half - y) / cell).astype(int)
    ok = (col >= 0) & (col < n) & (row >= 0) & (row < n)
    top = np.zeros((n, n))
    np.maximum.at(top, (row[ok], col[ok]), h[ok])
    top = ndi.grey_closing(top, size=5)
    top = ndi.gaussian_filter(top, 2.2)
    fine, bold = [], []
    height = float(h.max())
    for cm in range(10, int(height * 100), 10):
        lines = contours(top, cm / 100, cell, (n / 2, n / 2), min_len=40, tolerance=0.35)
        (bold if cm % 50 == 0 else fine).extend(lines)
    seen = ndi.gaussian_filter(((top > 0.02).astype(float)), 3)
    extent = contours(seen, 0.5, cell, (n / 2, n / 2), min_len=200, tolerance=0.6)
    facts = {"longSideM": 2.0, "heightM": round(height, 2), "splats": int(meta["count"])}
    # Its long side, drawn above it: 2 m, as Splashery sets it.
    left, right, high = float(x.min()), float(x.max()), float(y.max())
    facts["drawnLongSideM"] = round(right - left, 3)
    measure_line = [round(left, 3), round(high + 0.1, 3), round(right, 3), round(high + 0.1, 3)]
    return {"unit": 0.001, "lines": {"fine": pack(fine, 0.001, 0.002), "bold": pack(bold, 0.001, 0.002), "extent": pack(extent, 0.001, 0.004)}, "measure": measure_line}, facts


def leaves(name, width_m, center, shrink=1):
    """Leaves against the dark between them: the edge of everything leaf-green and bright."""
    rgb = picture(name, shrink)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    scale = width_m / rgb.shape[1]
    origin = (center[0] * rgb.shape[1], center[1] * rgb.shape[0])
    return rgb, r, g, b, scale, origin


def leaf():
    rgb, r, g, b, scale, origin = leaves("leaf.jpg", 0.135, (0.322, 0.52))
    green = ndi.gaussian_filter(np.clip(g - np.maximum(r * 0.72, b), 0, 1), 1.0)
    mask = green > 0.16
    mask = morphology.remove_small_objects(mask, 800)
    mask = morphology.remove_small_holes(mask, 400)
    edge = contours(ndi.gaussian_filter(mask.astype(float), 0.8), 0.5, scale, origin, min_len=60, tolerance=0.8)
    lum = 0.3 * r + 0.6 * g + 0.1 * b
    ridge = filters.sato(ndi.gaussian_filter(lum, 1.0), sigmas=[1.5, 2.5], black_ridges=False)
    inner = ndi.binary_erosion(mask, iterations=6)
    veins_mask = (ridge > np.percentile(ridge[inner], 90)) & inner
    veins_mask = morphology.remove_small_objects(veins_mask, 120)
    veins = contours(ndi.gaussian_filter(veins_mask.astype(float), 0.8), 0.5, scale, origin, min_len=40, tolerance=0.9)
    # How wide the leaf in the middle is, tip to tip, as the picture shows it.
    lab = measure.label(mask)
    here = lab[int(origin[1]), int(origin[0])]
    cols = np.where((lab == here).any(axis=0))[0]
    rows = np.where((lab == here).any(axis=1))[0]
    facts = {"pictureWidthM": 0.135, "bladeSpanM": round(float((cols.max() - cols.min()) * scale), 4)}
    # The blade's span, drawn above it.
    top_y = -(rows.min() - origin[1]) * scale + 0.004
    measure_line = [round(float((cols.min() - origin[0]) * scale), 5), round(float(top_y), 5), round(float((cols.max() - origin[0]) * scale), 5), round(float(top_y), 5)]
    return {"unit": 0.0001, "lines": {"edge": pack(edge, 0.0001, 0.00012), "veins": pack(veins, 0.0001, 0.00012)}, "measure": measure_line}, facts


def cells():
    rgb = picture("cells.jpg", 2)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    scale = 200e-6 / rgb.shape[1]
    origin = (0.4795 * rgb.shape[1], 0.4445 * rgb.shape[0])
    red = ndi.gaussian_filter(np.clip(r - np.maximum(g, b), 0, 1), 1.4)
    plastids = contours(red, 0.22, scale, origin, min_len=14, tolerance=0.9)
    cyan = ndi.gaussian_filter(np.clip(np.minimum(g, b) - r, 0, 1), 1.2)
    wall = morphology.remove_small_objects(cyan > 0.3, 300)
    wall = morphology.remove_small_objects(wall, 1500)
    walls = contours(ndi.gaussian_filter(wall.astype(float), 1.0), 0.5, scale, origin, min_len=160, tolerance=1.1)
    u = 5e-8
    rings = pack(plastids, u, 1.2e-7)
    # The size of the chloroplasts as drawn: each ring's area, as the width of a circle.
    sizes = []
    for run in rings:
        q = np.asarray(run, dtype=float).reshape(-1, 2)
        a = abs(float(np.dot(q[:, 0], np.roll(q[:, 1], -1)) - np.dot(q[:, 1], np.roll(q[:, 0], -1)))) / 2
        sizes.append(2 * math.sqrt(a / math.pi) * u)
    sizes.sort()
    facts = {"pictureWidthM": 200e-6, "plastids": len(rings), "plastidMedianM": round(sizes[len(sizes) // 2], 9)}
    return {"unit": u, "lines": {"plastids": rings, "walls": pack(walls, u, 1.6e-7)}}, facts


def chloroplast():
    rgb = picture("chloroplast.jpg", 2)
    dark = 1 - rgb.mean(axis=2)
    scale = 4.5e-6 / rgb.shape[1]
    origin = (0.6 * rgb.shape[1], 0.5 * rgb.shape[0])
    # The envelope: where the grainy stroma ends and the pale cytoplasm begins. The chloroplast
    # the zoom closes on, and its neighbor at the picture's edge.
    body = ndi.gaussian_filter(dark, 9)
    mask = body > filters.threshold_otsu(body)
    mask = morphology.remove_small_holes(morphology.remove_small_objects(mask, 6000), 6000)
    # The picture's right edge runs through the next cell's wall, as dark as the stroma: nothing
    # past 0.915 of the width belongs to this chloroplast. Then opened, so no thin bridge of
    # dark grain joins it to what lies beside it.
    mask[:, int(0.915 * mask.shape[1]) :] = False
    mask = morphology.binary_opening(mask, morphology.disk(30))
    lab = measure.label(mask)
    here = lab[int(origin[1]), int(origin[0])]
    main = lab == here
    sizes = sorted(((p.area, p.label) for p in measure.regionprops(lab) if p.label != here), reverse=True)
    keep = main | (lab == sizes[0][1]) if sizes else main
    envelope = contours(ndi.gaussian_filter(keep.astype(float), 2.5), 0.5, scale, origin, min_len=200, tolerance=1.0)
    # The thylakoid membranes: thin dark lines inside it.
    ridge = filters.sato(ndi.gaussian_filter(dark, 1.0), sigmas=[1.6, 2.6], black_ridges=False)
    inside = ndi.binary_erosion(main, iterations=14)
    lines = (ridge > np.percentile(ridge[inside], 90)) & inside
    lines = morphology.remove_small_objects(lines, 260)
    lamellae = contours(ndi.gaussian_filter(lines.astype(float), 0.9), 0.5, scale, origin, min_len=60, tolerance=0.9)
    # Its length: the two points of its outline farthest apart.
    edge = max(measure.find_contours(main.astype(float), 0.5), key=len)[::6]
    d = np.hypot(edge[:, None, 0] - edge[None, :, 0], edge[:, None, 1] - edge[None, :, 1])
    i, j = np.unravel_index(d.argmax(), d.shape)
    ends = [((edge[k][1] - origin[0]) * scale, -(edge[k][0] - origin[1]) * scale) for k in (i, j)]
    facts = {"pictureWidthM": 4.5e-6, "lengthM": round(float(d.max() * scale), 9)}
    # The measure runs beside it, a little way off its long axis.
    (x1, y1), (x2, y2) = ends
    nx, ny = -(y2 - y1), x2 - x1
    off = 0.62e-6 / math.hypot(nx, ny)
    if ny * off < 0:
        off = -off
    measure_line = [round(v, 10) for v in (x1 + nx * off, y1 + ny * off, x2 + nx * off, y2 + ny * off)]
    u = 2e-9
    return {"unit": u, "lines": {"envelope": pack(envelope, u, 4e-9), "lamellae": pack(lamellae, u, 4e-9)}, "measure": measure_line}, facts


def ribosome():
    def headed(name):
        raw = gzip.open(SRC / "small" / name).read()
        n = struct.unpack("<I", raw[:4])[0]
        return json.loads(raw[4 : 4 + n]), raw[4 + n :]

    head, body = headed("ribosome.vol.gz")
    nx, ny, nz = head["n"]
    vol = np.frombuffer(body, dtype=np.uint8).reshape(nz, ny, nx)  # x fastest
    level = (head["level"] - head["lo"]) / ((head["hi"] - head["lo"]) / 255)
    voxel = head["voxel"][0] * 1e-10
    # Seen along the map's z: everything at or above EMDB's recommended level, as one outline.
    shadow = (vol >= level).any(axis=0).astype(float)  # (y, x)
    up = ndi.zoom(shadow, 4, order=1)
    up = ndi.gaussian_filter(up, 2.0)
    ys, xs = np.nonzero(shadow)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    outline = []
    for c in measure.find_contours(up, 0.5):
        if len(c) < 60:
            continue
        c = measure.approximate_polygon(c, 0.9)
        outline.append(np.column_stack([(c[:, 1] / 4 - cx) * voxel, (c[:, 0] / 4 - cy) * voxel]))
    facts = {
        "acrossM": [round(float((xs.max() - xs.min() + 1) * voxel), 10), round(float((ys.max() - ys.min() + 1) * voxel), 10)],
        "voxelM": voxel,
        "level": head["level"],
        "emdb": head["emdb"],
        "pdb": head["pdb"],
    }
    # The fitted model's backbone, chain by chain: RNA and protein.
    mhead, mbody = headed("ribosome-model.bin")
    q = np.frombuffer(mbody, dtype="<i2").reshape(-1, 3) / 10 + np.asarray(mhead["origin"])
    at0 = np.asarray(head["at0"])
    rna, protein, o = [], [], 0
    for ch in mhead["chains"]:
        p = (q[o : o + ch["n"]] - at0) / head["voxel"][0]  # voxel coordinates
        o += ch["n"]
        line = np.column_stack([(p[:, 0] - cx) * voxel, (p[:, 1] - cy) * voxel])
        (rna if ch["kind"] == "nucleic" else protein).append(line)
    facts["chains"] = {"rna": len(rna), "protein": len(protein)}
    u = 5e-11
    left, right, high = (xs.min() - cx) * voxel, (xs.max() + 1 - cx) * voxel, (ys.max() + 1 - cy) * voxel
    measure_line = [round(float(v), 11) for v in (left, high + 1.3e-9, right, high + 1.3e-9)]
    return {"unit": u, "lines": {"outline": pack(outline, u, 1.2e-10), "rna": pack(rna, u, 1.6e-10), "protein": pack(protein, u, 1.6e-10)}, "measure": measure_line}, facts


def small():
    out, facts = {}, {}
    for name, fn in (("bed", bed), ("leaf", leaf), ("cells", cells), ("chloroplast", chloroplast), ("ribosome", ribosome)):
        out[name], facts[name] = fn()
        print(f"  {name}: {count(out[name]['lines'])} points", {g: len(v) for g, v in out[name]["lines"].items()}, facts[name])
    out["facts"] = facts
    return out


def preview(name, layer, extent=None):
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(9, 9), dpi=110)
    fig.patch.set_facecolor("#0d1040")
    ax.set_facecolor("#0d1040")
    colors = ["#eef0ff", "#e8bd5a", "#8fd0ff", "#ff9aa2", "#9be29b", "#c9a0ff", "#ffffff"]
    for i, (group, lines) in enumerate(layer["lines"].items()):
        for run in lines:
            p = np.asarray(run).reshape(-1, 2) * layer["unit"]
            ax.plot(p[:, 0], p[:, 1], color=colors[i % len(colors)], lw=0.6)
    if "trees" in layer:
        p = np.asarray(layer["trees"]).reshape(-1, 2) * layer["unit"]
        ax.plot(p[:, 0], p[:, 1], ".", color="#9be29b", ms=2)
    for x, y, text in layer.get("labels", []):
        ax.text(x, y, text, color="#e8bd5a", fontsize=7)
    ax.plot([0], [0], "+", color="#e8bd5a")
    ax.set_aspect("equal")
    if extent:
        ax.set_xlim(-extent, extent)
        ax.set_ylim(-extent, extent)
    ax.tick_params(colors="#eef0ff", labelsize=6)
    fig.savefig(PREVIEW / f"{name}.png", bbox_inches="tight")
    plt.close(fig)


def write(name, const, data, credit):
    text = f"// Made by tools/trace.py. Do not edit by hand.\n{credit}export const {const} = {json.dumps(data, separators=(',', ':'), ensure_ascii=False)};\n"
    (OUT / name).write_text(text)
    print(f"{name}: {len(text) // 1024} KB")


if __name__ == "__main__":
    only = [a for a in sys.argv[2:] if not a.startswith("--") and a != str(PREVIEW)]
    if not only or "ground" in only:
        print("ground")
        g = ground()
        write("ground.js", "GROUND", g, "// Washington's outlines: © OpenStreetMap contributors, Open Database License (ODbL).\n// This file is a derivative database and is offered under the same license.\n")
        if PREVIEW:
            preview("city", g["city"])
            preview("mall", g["mall"])
            preview("garden", g["garden"], 110)
            preview("garden-near", g["garden"], 14)
    if not only or "small" in only:
        print("small")
        s = small()
        write(
            "small.js",
            "SMALL",
            s,
            "// The garden bed: 'Golden Fullmoon Maple', a 3D capture by Joshua Trapani, CC BY 4.0.\n"
            "// One leaf: 'Golden Full Moon Maple' by susteph (Flickr), CC BY 2.0.\n"
            "// Cells: 'Arabidopsis thaliana plant cells containing chloroplasts' by Fernan Federici\n"
            "//   (Wellcome Collection), CC BY 4.0.\n"
            "// A chloroplast: 'Chloroplast in a bean leaf, TEM' by Kevin Mackenzie, University of\n"
            "//   Aberdeen (Wellcome Collection), CC BY 4.0.\n"
            "// The ribosome: cryo-EM map EMD-48329 and model PDB 9MKK (Majumdar et al. 2025), public domain.\n"
            "// These outlines are traced from those works.\n",
        )
        if PREVIEW:
            for k in ("bed", "leaf", "cells", "chloroplast", "ribosome"):
                preview(k, s[k])
