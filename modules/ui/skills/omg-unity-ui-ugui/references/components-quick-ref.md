---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: ui
protected: false
---
# Core uGUI Components — Quick Reference

```csharp
// Helper
static RectTransform CreateUIElement(string name, Transform parent)
{
    var go = new GameObject(name, typeof(RectTransform));
    go.transform.SetParent(parent, false);
    return go.GetComponent<RectTransform>();
}

// Image (sprite / solid color)
var img = CreateUIElement("Icon", parent).gameObject.AddComponent<Image>();
img.sprite = mySprite;
img.raycastTarget = false; // disable on decorative (perf)

// RawImage (render texture / video / minimap)
var raw = CreateUIElement("Map", parent).gameObject.AddComponent<RawImage>();
raw.texture = renderTex;
raw.uvRect  = new Rect(0, 0, 1, 1);

// TextMeshProUGUI — always use over legacy UnityEngine.UI.Text
var tmp = CreateUIElement("Label", parent).gameObject.AddComponent<TMPro.TextMeshProUGUI>();
tmp.text      = "Score: 0";
tmp.fontSize  = 24;
tmp.alignment = TMPro.TextAlignmentOptions.Center;
tmp.raycastTarget = false;

// Button
var btnGO = CreateUIElement("Btn", parent).gameObject;
var btn   = btnGO.AddComponent<Button>();
btn.targetGraphic = btnGO.AddComponent<Image>();
btn.onClick.AddListener(() => Debug.Log("clicked"));

// Toggle
var toggle = CreateUIElement("Toggle", parent).gameObject.AddComponent<Toggle>();
toggle.isOn = true;
toggle.onValueChanged.AddListener(on => Debug.Log($"toggle: {on}"));

// Slider
var slider     = CreateUIElement("Slider", parent).gameObject.AddComponent<Slider>();
slider.minValue = 0f; slider.maxValue = 1f; slider.value = 0.5f;
slider.direction = Slider.Direction.LeftToRight;
slider.onValueChanged.AddListener(v => { /* update HP bar */ });

// TMP_Dropdown
var drop = CreateUIElement("Drop", parent).gameObject.AddComponent<TMPro.TMP_Dropdown>();
drop.AddOptions(new List<string> { "Option A", "Option B" });
drop.onValueChanged.AddListener(i => Debug.Log($"selected: {i}"));

// TMP_InputField
var input = CreateUIElement("Input", parent).gameObject.AddComponent<TMPro.TMP_InputField>();
input.characterLimit = 32;
input.onEndEdit.AddListener(s => Debug.Log($"submitted: {s}"));
```
