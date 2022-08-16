# HAC Programmer
This is a program to configure a HAC with firmware.

# Requirements

- FT_Prog (The program will notify you if it can't the find FT_Prog executable)
- HAC driver (The program is useless without it, and can't notify you if it can't find it.)
- HAC Config file.

# Usage

- Load your HAC Config file (You only have to do this once)

![HAC File Upload](https://user-images.githubusercontent.com/44531907/184679815-d54e6003-9d40-4d9f-8a8f-e98e8a79c250.gif)

- Plug in your HAC. The program will start, and soon your HAC will have its firmware on it.

![HAC Program](https://user-images.githubusercontent.com/44531907/184824439-cd3b0f3a-be43-4705-b361-62239cada1cf.gif)

- To clear the HAC. Plug in your programmed HAC, and click "Clear device?".

![HAC Clear](https://user-images.githubusercontent.com/44531907/184829102-cb40021d-9d71-4cf8-81d5-de721aaa70cd.gif)

## Counters
As you can see in the images above, you can add counters to keep track of how many HAC's you have programmed. <br>
This is entirely optional.

## Settings
In the menu bar, you can change the following settings:

| Setting                                  | Meaning                                                                                                                                            | Default value |
|------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| Notify when device is already programmed | If enabled, you will receive a notification indicating if your HAC has already been programmed. (When the GUI is not active)                       | False         |
| Start programming in the background      | If enabled, the program will start programming in the background when it finds a HAC. You will receive a notification indicating if it is working. | False         |
| Clear output console on unplug           | If enabled, the output log will clear when the HAC gets unplugged.                                                                                 | True          |
| Run in background                        | If enabled, the program will stay active in the taskbar tray. You can click on it to activate the GUI.                                             | True          |
