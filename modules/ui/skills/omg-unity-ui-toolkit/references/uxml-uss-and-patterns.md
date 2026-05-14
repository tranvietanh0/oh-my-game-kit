---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: ui
protected: false
---
# UI Toolkit — UXML, USS & Runtime Patterns

## UXML Structure

```xml
<ui:UXML xmlns:ui="UnityEngine.UIElements">
    <ui:VisualElement name="root" class="container">
        <ui:Label text="Score: 0" name="score-label" />
        <ui:Button text="Start" name="start-btn" class="primary-btn" />
        <ui:TextField label="Name" name="name-field" />
        <ui:ListView name="inventory-list" />
        <ui:ScrollView>
            <ui:Label text="Long content..." />
        </ui:ScrollView>
        <ui:Foldout text="Settings">
            <ui:Slider label="Volume" low-value="0" high-value="1" />
            <ui:Toggle label="Fullscreen" />
        </ui:Foldout>
    </ui:VisualElement>
</ui:UXML>
```

## USS (Unity Style Sheets)

```css
.container {
    flex-direction: column;
    padding: 10px;
    background-color: rgba(0, 0, 0, 0.8);
}

#score-label {
    font-size: 24px;
    color: white;
    -unity-font-style: bold;
}

.primary-btn {
    background-color: #4CAF50;
    color: white;
    border-radius: 5px;
    padding: 10px 20px;
}

.primary-btn:hover {
    background-color: #45a049;
}

.primary-btn:active {
    scale: 0.95 0.95;
}
```

**USS vs CSS differences**: `-unity-` prefix for Unity-specific properties. `flex-grow`, `flex-shrink`, `flex-basis` work. No CSS Grid — use nested flex containers.

## C# — Querying & Events

```csharp
public class GameUI : MonoBehaviour {
    [SerializeField] UIDocument uiDocument;

    void OnEnable() {
        var root = uiDocument.rootVisualElement;

        // Query elements:
        var scoreLabel = root.Q<Label>("score-label");
        var startBtn = root.Q<Button>("start-btn");
        var nameField = root.Q<TextField>("name-field");

        // Register callbacks:
        startBtn.clicked += OnStartClicked;
        nameField.RegisterValueChangedCallback(evt => {
            Debug.Log($"Name: {evt.newValue}");
        });

        // Query by class:
        var allButtons = root.Query<Button>(className: "primary-btn").ToList();
    }

    void UpdateScore(int score) {
        var label = uiDocument.rootVisualElement.Q<Label>("score-label");
        label.text = $"Score: {score}";
    }
}
```

## Runtime Element Creation

```csharp
var container = new VisualElement();
container.style.flexDirection = FlexDirection.Row;

var btn = new Button(() => Debug.Log("Clicked!")) { text = "Dynamic Button" };
btn.AddToClassList("primary-btn");

container.Add(btn);
root.Add(container);
```

## ListView (Data Binding)

```csharp
var listView = root.Q<ListView>("inventory-list");
listView.itemsSource = items;                    // IList
listView.makeItem = () => new Label();           // Factory
listView.bindItem = (element, index) => {        // Bind
    (element as Label).text = items[index].name;
};
listView.fixedItemHeight = 30;
listView.selectionChanged += selection => { };
```

## Common Controls

`Label`, `Button`, `TextField`, `Toggle`, `Slider`, `SliderInt`, `MinMaxSlider`, `DropdownField`, `RadioButton`, `RadioButtonGroup`, `ProgressBar`, `Foldout`, `ScrollView`, `ListView`, `TreeView`, `GroupBox`, `HelpBox`

## Common Gotchas

1. **Q() returns null**: Element not found — check name/type spelling, ensure UXML loaded
2. **Styles not applying**: USS must be referenced in UXML via `<Style src="...">` or added via `styleSheets.Add()`
3. **World-space UI**: UI Toolkit supports it via `PanelSettings.panel3DPosition` but Canvas is more mature
4. **Font**: Use `-unity-font-definition` for TextMeshPro fonts in USS
5. **Picking mode**: Set `pickingMode = PickingMode.Ignore` on overlay elements that shouldn't block clicks
