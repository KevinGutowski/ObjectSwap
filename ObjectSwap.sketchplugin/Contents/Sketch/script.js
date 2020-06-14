let sketch = require('sketch')
let threadID = "com.kevingutowski.objectSwap"
let fiber,objects,popupButtonState

var onRun = function(context) {
  runPanel()
};

function runPanel() {
  let threadDictionary = NSThread.mainThread().threadDictionary()

  // If there is already a panel, prevent the plugin from running again
  if (threadDictionary[threadID]) {
    closePanel(threadDictionary[threadID], threadDictionary, threadID)
  } else {
    threadDictionary.panelOpen = true
    setupPanel(threadDictionary, threadID)
    fiber = require('sketch/async').createFiber()
  }
}

function setupPanel(threadDictionary, threadIdentifier) {
  var panelWidth = 300
  var panelHeight = 74
  let panel = NSPanel.alloc().init()
  panel.setFrame_display(NSMakeRect(0, 0, panelWidth, panelHeight), true)
  panel.setStyleMask(NSTexturedBackgroundWindowMask | NSTitledWindowMask | NSClosableWindowMask)

  panel.center()
  panel.makeKeyAndOrderFront(null)
  panel.setLevel(NSFloatingWindowLevel)

  panel.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true)
  panel.standardWindowButton(NSWindowZoomButton).setHidden(true)

  let contentViewContent = setupContentView()
  contentViewContent.setFrameSize(NSMakeSize(panelWidth, contentViewContent.frame().size.height))
  panel.contentView().addSubview(contentViewContent)
  panel.contentView().setFlipped(true)

  let closeButton = panel.standardWindowButton(NSWindowCloseButton)
  closeButton.setCOSJSTargetFunction((sender) => {
    closePanel(panel,threadDictionary,threadIdentifier)
  })
}

function setupContentView() {
  let dropDownLabel = createTextField({
    text: "Select Object:",
    alignment: NSTextAlignmentRight
  })

  let objectNames = getObjects()
  let popupButton = createPopupButtonWithItems(objectNames)

  let addButton = createButton("Insert")

  let stackView = NSStackView.stackViewWithViews([dropDownLabel, popupButton, addButton])
  stackView.edgeInsets = NSEdgeInsetsMake(16, 16, 16, 16)

  return stackView
}

function getObjects() {
    let document = sketch.getSelectedDocument()

    let objectPage = document.pages.find(page => page.name == "Objects")

    objects = sketch.find('Artboard,[name^="object"]', objectPage)
    return objects.map(layer => layer.name)
}

function createTextField({ text, alignment, fontSize = 13 }) {
  const label = NSTextField.labelWithString(text)
  label.setAlignment(alignment)
  label.setFont(NSFont.systemFontOfSize(fontSize))
  label.setEditable(false)
  return label
}

function createPopupButtonWithItems(items) {
    let popupButton = NSPopUpButton.alloc().initWithFrame(NSMakeRect(0, 0, 150, 25))
    popupButton.addItemsWithTitles(items)
    popupButtonState = popupButton.indexOfSelectedItem()
    popupButton.setCOSJSTargetFunction(sender => popupButtonChanged(sender))

    return popupButton
}

function popupButtonChanged(sender) {
    popupButtonState = sender.indexOfSelectedItem()
}

function createButton(text) {
  const button = NSButton.alloc().init()
  button.setButtonType(NSButtonTypeMomentaryPushIn)
  button.bezelStyle = NSBezelStyleRounded
  button.title = text

  button.setCOSJSTargetFunction(sender => buttonDidClick(sender))

  return button
}

function buttonDidClick(sender) {
    let document = sketch.getSelectedDocument()
    let selectedLayer = document.selectedLayers.layers[0]

    if (selectedLayer.type = "Artboard") {
        let selectedObject = objects[popupButtonState]
        let duplicatedLayer = selectedObject.layers[0].duplicate()
        duplicatedLayer.parent = selectedLayer
    }
}

function closePanel(panel,threadDictionary,threadIdentifier) {
    panel.close()

    threadDictionary.removeObjectForKey(threadIdentifier)
    threadDictionary.panelOpen = false

    if (fiber) {
        fiber.cleanup()
    }
}
