import sys
import os
import glob
import numpy as np
import trimesh

from OCP.STEPControl import STEPControl_Reader
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.IMeshTools import IMeshTools_Parameters
from OCP.StlAPI import StlAPI_Writer
from OCP.IFSelect import IFSelect_RetDone


def step_to_stl(step_path, stl_path):
    reader = STEPControl_Reader()
    status = reader.ReadFile(step_path)
    if status != IFSelect_RetDone:
        raise RuntimeError(f"STEP read failed, status={status}")
    reader.TransferRoots()
    shape = reader.OneShape()
    if shape is None:
        raise RuntimeError("No shape transferred from STEP")

    params = IMeshTools_Parameters()
    params.Deflection = 0.001
    params.Angle = 0.4
    params.Relative = True
    params.InParallel = True
    params.CleanModel = True
    mesher = BRepMesh_IncrementalMesh(shape, params)
    mesher.Perform()

    writer = StlAPI_Writer()
    writer.ASCIIMode = False
    writer.Write(shape, stl_path)
    if os.path.getsize(stl_path) == 0:
        raise RuntimeError("STL output empty")
    return shape


def stl_to_glb(stl_path, glb_path, base_color=(0.72, 0.72, 0.75, 1.0)):
    m = trimesh.load(stl_path, force='mesh')
    if m is None or len(getattr(m, 'faces', [])) == 0:
        raise RuntimeError("trimesh loaded empty mesh")

    pbr = trimesh.visual.material.PBRMaterial(
        baseColorFactor=base_color,
        metallicFactor=1.0,
        roughnessFactor=0.32,
    )
    m.visual = trimesh.visual.TextureVisuals(material=pbr)

    m.export(glb_path)
    print(f"  vertices={len(m.vertices)}  faces={len(m.faces)}")
    print(f"  glb size = {os.path.getsize(glb_path)/1024:.1f} KB")


def convert(step_path, glb_path):
    stl_tmp = os.path.splitext(glb_path)[0] + ".tmp.stl"
    print(f"[1/2] STEP -> STL mesh")
    step_to_stl(step_path, stl_tmp)
    print(f"[2/2] STL -> GLB (metallic material)")
    stl_to_glb(stl_tmp, glb_path)
    try:
        os.remove(stl_tmp)
    except OSError:
        pass
    print(f"DONE -> {glb_path}")


if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) >= 2:
        convert(args[0], args[1])
    elif len(args) == 1:
        convert(args[0], os.path.splitext(args[0])[0] + ".glb")
    else:
        base = r"D:\LibertaFolder\Program\aqn-cylinder-selector\3D"
        stps = sorted(glob.glob(os.path.join(base, "*.stp")) +
                      glob.glob(os.path.join(base, "*.step")))
        if not stps:
            print("3D 文件夹里没有 .stp / .step 文件")
        for sp in stps:
            gp = os.path.splitext(sp)[0] + ".glb"
            print(f"\n=== {os.path.basename(sp)} ===")
            try:
                convert(sp, gp)
            except Exception as e:
                print(f"转换失败: {e}")
