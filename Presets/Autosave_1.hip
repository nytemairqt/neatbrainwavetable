Processor 
Type SynthChain ID neatbrainwavetable Bypassed Gain 	      �?Balance 	        VoiceLimit 	      P@KillFadeTime 	      4@IconColour 0 packageName  BuildVersion �  EditorStates BodyShown 0 Visible 1 Solo 0 Folded 1  ChildProcessors  Processor Type MidiProcessorChain ID Midi Processor Bypassed EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors  Processor Type ScriptProcessor ID Interface Bypassed Script �Content.makeFrontInterface(600, 600);

// HYPERPAMETERS
const EXTRACTWAVETABLES = true;
const EXTRACTRESIDUES = false;
const BUILDSAMPLEMAP = false;
const USEMANUALTUNING = true;
const WG_FOLDER = "e12";
const RS_FOLDER = "leftRS";
const PITCH_START = 0.1;
const PITCH_END = 0.8;
const TRIM_START = 0.05;
const TRIM_END = 0.7;
const LOOP_START = 0.3;
const FADE_TIME = 15;
const MANUAL_TUNING = 659.4;

// GLOBALS
const SAMPLERATE = 44100.0;
reg PENDING = false;
const AUDIOFILES = FileSystem.getFolder(FileSystem.AudioFiles);
const SAMPLES = FileSystem.getFolder(FileSystem.Samples);
const SAMPLEMAPS = FileSystem.getFolder(FileSystem.Samples).getParentDirectory().getChildFile("sampleMaps");
reg TARGET = 440.0;
const keyRange = [12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 88];
const Sampler1 = Synth.getChildSynth("Sampler1");

include("lorisFunctions.js");



// Press the big red button
inline function onButton1Control(component, value)
{
	if (value)
	{
		// create directories if they dont exist	
		local WG_SAMPLES = SAMPLES.createDirectory(WG_FOLDER);
		local RS_SAMPLES = SAMPLES.createDirectory(RS_FOLDER);
		

		local audioFiles = FileSystem.findFiles(AUDIOFILES, "*.wav", false);
		
		for (i=0; i<audioFiles.length; i++)
		{
			for (j=0; j<keyRange.length; j++)
			{
				Console.clear();

				local hz = Engine.getFrequencyForMidiNoteNumber(keyRange[j]);
				extractWavetable(audioFiles[i], hz, keyRange[j], i, 1, 127, WG_SAMPLES, RS_SAMPLES);					
				Console.print("Audio File: " + (i+1) + "/" + audioFiles.length);
				Console.print("Wavetable: " + (j+1) + "/" + keyRange.length);
			}			
		}									
		Console.clear();
		Console.print("Finished extracting Wavetables.");
		buildSampleMap(WG_SAMPLES);					
	}	
};

Content.getComponent("Button1").setControlCallback(onButton1Control);



function onNoteOn()
{
	
}
 function onNoteOff()
{
	
}
 function onController()
{
	
}
 function onTimer()
{
	
}
 function onControl(number, value)
{
	
}
  EditorStates BodyShown 1 Visible 1 Solo 0 contentShown 1 onInitOpen 1  ChildProcessors   Content   UIData  ContentProperties DeviceType 	Desktop Component type ScriptButton id 	Button1 x 	     �g@y 	     @p@isMomentary 1 saveInPreset 0  Component type ScriptFloatingTile id FloatingTile1 x 	        y 	     �~@width 	     ��@height 	      Y@ContentType 
Keyboard bgColour 4284769380 itemColour 452984831 itemColour2 4294967295 textColour 0 Data ]{
  "KeyWidth": 14.0,
  "DisplayOctaveNumber": false,
  "LowKey": 12,
  "HiKey": 88,
  "CustomGraphics": false,
  "DefaultAppearance": true,
  "BlackKeyRatio": 0.699999988079071,
  "ToggleMode": false,
  "MidiChannel": 1,
  "UseVectorGraphics": true,
  "UseFlatStyle": false,
  "MPEKeyboard": false,
  "MPEStartChannel": 2,
  "MPEEndChannel": 16
}  Processor Type ModulatorChain ID GainModulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID PitchModulation Bypassed Intensity 	        EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type EffectChain ID FX Bypassed EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type StreamingSampler ID 
Sampler1 Bypassed Gain 	      �?Balance 	        VoiceLimit 	      p@KillFadeTime 	      4@IconColour 0 PreloadSize 	      �@BufferSize 	      �@VoiceAmount 	      p@SamplerRepeatMode 	      @RRGroupAmount 	      @PitchTracking 	      �?OneShot 	        CrossfadeGroups 	        Purged 	        Reversed 	        NumChannels    UseStaticMatrix 	        Group0Table  Group1Table  Group2Table  Group3Table  Group4Table  Group5Table  Group6Table  Group7Table  SampleMapID leftWG EditorStates BodyShown 1 Visible 1 Solo 0 MapPanelShown 1 BigSampleMap 1 Folded 1  ChildProcessors  Processor Type MidiProcessorChain ID Midi Processor Bypassed EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID GainModulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors  Processor Type AHDSR ID AHDSR Envelope1 Bypassed Monophonic 	        Retrigger 	      �?Intensity 	      �?AttackCurve 	        DecayCurve 	        Attack 	      @AttackLevel 	        Hold 	      $@Decay 	     ��@Sustain 	      Y�Release 	     ��@EcoMode 	      �?EditorStates BodyShown 1 Visible 1 Solo 0  ChildProcessors  Processor Type ModulatorChain ID Attack Time Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID Attack Level Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID Decay Time Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID Sustain Level Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID Release Time Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID PitchModulation Bypassed Intensity 	        EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type EffectChain ID FX Bypassed EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors  Processor 	Type PolyphonicFilter ID 	Filter1 Bypassed Gain 	        Frequency 	     ��@Q 	      �?Mode 	      @Quality 	        BipolarIntensity 	        EditorStates BodyShown 1 Visible 1 Solo 0  ChildProcessors  Processor Type ModulatorChain ID Frequency Modulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors  Processor Type AHDSR ID AHDSR Envelope2 Bypassed Monophonic 	        Retrigger 	      �?Intensity 	      �?AttackCurve 	        DecayCurve 	        Attack 	      @AttackLevel 	        Hold 	      $@Decay 	     ��@Sustain 	      Y�Release 	     ��@EcoMode 	      �?EditorStates BodyShown 1 Visible 1 Solo 0  ChildProcessors  Processor Type ModulatorChain ID Attack Time Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID Attack Level Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID Decay Time Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID Sustain Level Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID Release Time Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID Gain Modulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID Bipolar Freq Modulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID Q Modulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID Sample Start Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID Group Fade Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   RoutingMatrix NumSourceChannels    Channel0     Send0 ����Channel1    Send1 ���� channels  channelData enabled level 	        suffix   Processor Type SineSynth ID Sine Wave Generator1 Bypassed Gain 	      �?Balance 	        VoiceLimit 	      p@KillFadeTime 	      4@IconColour 0 OctaveTranspose 	        SemiTones 	        UseFreqRatio 	        CoarseFreqRatio 	      �?FineFreqRatio 	        SaturationAmount 	        EditorStates BodyShown 1 Visible 1 Solo 0 Folded 1  ChildProcessors  Processor Type MidiProcessorChain ID Midi Processor Bypassed EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID GainModulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors  Processor 	Type SimpleEnvelope ID DefaultEnvelope1 Bypassed Monophonic 	        Retrigger 	      �?Intensity 	      �?Attack 	      @Release 	      $@LinearMode 	      �?EditorStates BodyShown 1 Visible 1 Solo 0  ChildProcessors  Processor Type ModulatorChain ID Attack Time Modulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID PitchModulation Bypassed Intensity 	        EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type EffectChain ID FX Bypassed EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   RoutingMatrix NumSourceChannels    Channel0     Send0 ����Channel1    Send1 ���� RoutingMatrix NumSourceChannels    Channel0     Send0 ����Channel1    Send1 ���� macro_controls  macro name 	Macro 1 value 	        midi_cc ���� macro name 	Macro 2 value 	        midi_cc ���� macro name 	Macro 3 value 	        midi_cc ���� macro name 	Macro 4 value 	        midi_cc ���� macro name 	Macro 5 value 	        midi_cc ���� macro name 	Macro 6 value 	        midi_cc ���� macro name 	Macro 7 value 	        midi_cc ���� macro name 	Macro 8 value 	        midi_cc ���� MidiAutomation   MPEData Enabled  