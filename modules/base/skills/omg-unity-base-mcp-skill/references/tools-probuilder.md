---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Tools: ProBuilder

Complete reference for `manage_probuilder`. Requires `com.unity.probuilder`. Check with `ping` first.

> Prefer ProBuilder over primitive GameObjects for editable geometry, multi-material faces, or complex shapes.

**Parameters:** `action` (required), `target` (GO name/path/id), `search_method` (by_id/by_name/by_path/by_tag/by_layer), `properties` (dict or JSON string)

## Actions by Category

**Shape Creation:**
- `create_shape` — 12 types: Cube, Cylinder, Sphere, Plane, Cone, Torus, Pipe, Arch, Stair, CurvedStair, Door, Prism. Properties: shape_type, size, position, rotation, name
- `create_poly_shape` — From 2D polygon footprint. Properties: points, extrudeHeight, flipNormals

**Mesh Editing:**
- `extrude_faces` — faceIndices, distance, method (FaceNormal/VertexNormal/IndividualFaces)
- `extrude_edges` — edgeIndices or edges [{a,b},...], distance, asGroup
- `bevel_edges` — edgeIndices or edges, amount (0–1)
- `subdivide` — faceIndices (optional). Uses ConnectElements — connects midpoints, not quad-subdivision
- `delete_faces` — faceIndices
- `bridge_edges` — edgeA, edgeB as {a,b}, allowNonManifold
- `connect_elements` — edgeIndices or faceIndices
- `detach_faces` — faceIndices, deleteSourceFaces
- `flip_normals` — faceIndices
- `merge_faces` — faceIndices
- `combine_meshes` — targets list
- `merge_objects` — targets, name (auto-converts non-PB objects)
- `duplicate_and_flip` — faceIndices (creates double-sided geometry)
- `create_polygon` — vertexIndices, unordered

**Vertex Operations:**
- `merge_vertices` — vertexIndices, collapseToFirst
- `weld_vertices` — vertexIndices, radius
- `split_vertices` — vertexIndices
- `move_vertices` — vertexIndices, offset [x,y,z]
- `insert_vertex` — edge {a,b} or faceIndex + point [x,y,z]
- `append_vertices_to_edge` — edgeIndices or edges, count

**Selection:** `select_faces` — direction + tolerance, or growFrom + growAngle

**UV & Materials:**
- `set_face_material` — faceIndices, materialPath
- `set_face_color` — faceIndices, color [r,g,b,a]
- `set_face_uvs` — faceIndices, scale, offset, rotation, flipU, flipV

**Query:**
- `get_mesh_info` — include: "summary" (default), "faces" (+ normals/centers/directions, cap 100), "edges" (+ pairs/positions, cap 200), "all"
- `ping` — Check availability

**Smoothing:** `set_smoothing` (faceIndices, smoothingGroup: 0=hard 1+=smooth), `auto_smooth` (angleThreshold: default 30)

**Mesh Utilities:** `center_pivot`, `freeze_transform`, `validate_mesh`, `repair_mesh`

**Known Bugs (do not use):**
- `set_pivot` — vertex positions don't persist. Use `center_pivot` instead.
- `convert_to_probuilder` — MeshImporter throws. Use `create_shape`/`create_poly_shape` instead.

## Examples

```python
manage_probuilder(action="ping")
manage_probuilder(action="create_shape",
    properties={"shape_type": "Cube", "name": "MyCube"})
manage_probuilder(action="get_mesh_info", target="MyCube",
    properties={"include": "faces"})
manage_probuilder(action="extrude_faces", target="MyCube",
    properties={"faceIndices": [2], "distance": 1.5})
manage_probuilder(action="select_faces", target="MyCube",
    properties={"direction": "up", "tolerance": 0.7})
manage_probuilder(action="duplicate_and_flip", target="Room",
    properties={"faceIndices": [0,1,2,3,4,5]})
manage_probuilder(action="weld_vertices", target="MyCube",
    properties={"vertexIndices": [0,1,2,3], "radius": 0.1})
manage_probuilder(action="auto_smooth", target="MyCube",
    properties={"angleThreshold": 30})
manage_probuilder(action="center_pivot", target="MyCube")
manage_probuilder(action="validate_mesh", target="MyCube")
```

**Critical:** Face indices change after every edit — always re-query `get_mesh_info` before using indices from a previous call.

→ See `references/workflow-probuilder.md` for scene build and edit-verify loop patterns.
