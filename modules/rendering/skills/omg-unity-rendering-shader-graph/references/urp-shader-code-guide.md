---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: rendering
protected: false
---
# URP Code Shader — Full HLSL/ShaderLab Reference

## File Structure

```hlsl
Shader "Category/ShaderName"
{
    Properties { ... }
    SubShader
    {
        Tags { "RenderType"="Opaque" "RenderPipeline"="UniversalPipeline" "Queue"="Geometry" }
        LOD 100

        HLSLINCLUDE  // shared across all passes
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
        CBUFFER_START(UnityPerMaterial)
            float4 _BaseMap_ST;
            float  _Smoothness;
        CBUFFER_END
        ENDHLSL

        Pass { Name "ForwardLit"   Tags { "LightMode" = "UniversalForward" } ... }
        Pass { Name "ShadowCaster" Tags { "LightMode" = "ShadowCaster" }     ... }
        Pass { Name "DepthOnly"    Tags { "LightMode" = "DepthOnly" }        ... }
    }
    FallBack "Hidden/InternalErrorShader"
}
```

## Properties Block

```hlsl
Properties {
    _BaseMap ("Texture", 2D) = "white" {}  _BaseColor ("Color", Color) = (1,1,1,1)
    _Smoothness ("Smoothness", Range(0,1)) = 0.5  _Metallic ("Metallic", Range(0,1)) = 0.0
    [Toggle(_ALPHACLIP)] _AlphaClip ("Alpha Clip", Float) = 0
}
```

Types: `2D`, `Cube`, `Color`, `Float`, `Range(min,max)`, `Vector`

## CBUFFER — SRP Batcher Requirement

```hlsl
TEXTURE2D(_BaseMap); SAMPLER(sampler_BaseMap);  // textures OUTSIDE CBUFFER
CBUFFER_START(UnityPerMaterial)
    float4 _BaseMap_ST; float4 _BaseColor; float _Smoothness; float _Metallic;
CBUFFER_END  // CBUFFER must be IDENTICAL across ALL passes
```

## Vertex Input Semantics

```hlsl
struct Attributes {
    float4 positionOS : POSITION; float3 normalOS : NORMAL; float4 tangentOS : TANGENT;
    float2 uv : TEXCOORD0; float4 color : COLOR;  // vertex paint
    UNITY_VERTEX_INPUT_INSTANCE_ID                // GPU instancing
};
```

## Vertex Shader Helpers

```hlsl
VertexPositionInputs posInputs = GetVertexPositionInputs(IN.positionOS.xyz);
// .positionCS / .positionWS / .positionVS
VertexNormalInputs normInputs = GetVertexNormalInputs(IN.normalOS);
// .normalWS / .tangentWS / .bitangentWS
OUT.uv = TRANSFORM_TEX(IN.uv, _BaseMap);
OUT.fogFactor = ComputeFogFactor(posInputs.positionCS.z);
```

## Fragment Shader Patterns

### Unlit
```hlsl
half4 frag(Varyings IN) : SV_Target
{
    half4 color = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, IN.uv);
    color.rgb *= IN.vertexColor.rgb;
    return MixFog(color, IN.fogFactor);
}
```

### Lit — Minimal
```hlsl
half4 frag(Varyings IN) : SV_Target {
    float3 normalWS = normalize(IN.normalWS);
    Light mainLight = GetMainLight(TransformWorldToShadowCoord(IN.positionWS));
    half3 diffuse = mainLight.color * mainLight.distanceAttenuation * mainLight.shadowAttenuation
                  * saturate(dot(normalWS, mainLight.direction));
    half3 albedo = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, IN.uv).rgb;
    return half4(albedo * (diffuse + SampleSH(normalWS)), 1.0);
}
```

### Full PBR (UniversalFragmentPBR)
```hlsl
// Requires: #include ".../ShaderLibrary/Lighting.hlsl"
half4 frag(Varyings IN) : SV_Target {
    InputData inputData = (InputData)0;
    inputData.positionWS = IN.positionWS;
    inputData.normalWS = normalize(IN.normalWS);
    inputData.viewDirectionWS = GetWorldSpaceNormalizeViewDir(IN.positionWS);
    inputData.shadowCoord = TransformWorldToShadowCoord(IN.positionWS);
    SurfaceData surfaceData = (SurfaceData)0;
    surfaceData.albedo = _BaseColor.rgb; surfaceData.smoothness = _Smoothness;
    surfaceData.metallic = _Metallic; surfaceData.alpha = 1.0;
    return UniversalFragmentPBR(inputData, surfaceData);
}
```

## ShadowCaster & DepthOnly Passes

```hlsl
// ShadowCaster — required to cast shadows
Pass { Name "ShadowCaster" Tags { "LightMode" = "ShadowCaster" }
    ZWrite On ZTest LEqual ColorMask 0 Cull Back
    HLSLPROGRAM
    #pragma vertex shadowVert  #pragma fragment shadowFrag
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Shadows.hlsl"
    CBUFFER_START(UnityPerMaterial) float4 _BaseMap_ST; float _Smoothness; CBUFFER_END
    float3 _LightDirection;
    float4 shadowVert(float4 posOS:POSITION, float3 normOS:NORMAL) : SV_POSITION {
        float3 posWS = TransformObjectToWorld(posOS.xyz);
        float3 normWS = TransformObjectToWorldNormal(normOS);
        return TransformWorldToHClip(ApplyShadowBias(posWS, normWS, _LightDirection)); }
    half4 shadowFrag(float4 pos:SV_POSITION) : SV_Target { return 0; }
    ENDHLSL }

// DepthOnly — required for camera depth texture
Pass { Name "DepthOnly" Tags { "LightMode" = "DepthOnly" }
    ZWrite On ColorMask R Cull Back
    HLSLPROGRAM
    #pragma vertex depthVert  #pragma fragment depthFrag
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
    CBUFFER_START(UnityPerMaterial) float4 _BaseMap_ST; float _Smoothness; CBUFFER_END
    float4 depthVert(float4 pos:POSITION):SV_POSITION { return TransformObjectToHClip(pos.xyz); }
    half depthFrag(float4 pos:SV_POSITION):SV_Target { return 0; }
    ENDHLSL }
```

## Key URP Includes (`Packages/com.unity.render-pipelines.universal/ShaderLibrary/`)

| Include | Purpose |
|---------|---------|
| `Core.hlsl` | Transforms, macros, CBUFFER macros |
| `Lighting.hlsl` | GetMainLight, SampleSH, UniversalFragmentPBR |
| `Shadows.hlsl` | ApplyShadowBias, TransformWorldToShadowCoord |
| `SurfaceInput.hlsl` | SurfaceData struct |
