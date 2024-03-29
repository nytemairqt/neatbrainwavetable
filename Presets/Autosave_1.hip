Processor 
Type SynthChain ID neatbrainwavetable Bypassed Gain 	      �?Balance 	        VoiceLimit 	      P@KillFadeTime 	      4@IconColour 0 packageName  BuildVersion �  EditorStates BodyShown 0 Visible 1 Solo 0 Folded 1  ChildProcessors  Processor Type MidiProcessorChain ID Midi Processor Bypassed EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors  Processor Type ScriptProcessor ID Interface Bypassed Script �Content.makeFrontInterface(600, 600);

// HYPERPAMETERS
const EXTRACTWAVETABLES = false;
const BUILDSAMPLEMAP = true;

// GLOBALS
const SAMPLERATE = 44100.0;
reg PENDING = false;
const MIDDLE_C = 261.63;
const ROOT = FileSystem.getFolder(FileSystem.AudioFiles);
const SAMPLES = FileSystem.getFolder(FileSystem.Samples);
const SAMPLEMAPS = FileSystem.getFolder(FileSystem.Samples).getParentDirectory().getChildFile("sampleMaps");
const WAVETABLES = SAMPLES.getChildFile("wavetables");
reg TARGET = 440.0;
const keyRange = [12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 88];
const Sampler1 = Synth.getChildSynth("Sampler1");

reg testSample;

// Instantiate Loris Engine
const worker = Engine.createBackgroundTask("Loris Processor");
worker.setTimeOut(10000);
worker.setForwardStatusToLoadingThread(true);

const lorisManager = Engine.getLorisManager();
lorisManager.set("timedomain", "0to1");
lorisManager.set("enablecache", "false");

// Print
inline function print(stringToPrint)
{
	if (isDefined(stringToPrint.length))
	{
		for (str in stringToPrint)
		{
			Console.print(str);
		}
	}
	else
	{
		Console.print(stringToPrint);
	}
}

// Repitch Buffer
inline function repitch(obj)
{
	local ratio = TARGET / obj.rootFrequency;
	obj.frequency *= ratio;	
}

// Save Audio To File
inline function saveAudio(path, buffer)
{
	path.writeAudioFile(buffer, SAMPLERATE, 24);
}

// Abort Process
inline function abort()
{
	worker.setProgress(0.0);
	worker.setStatusMessage("Cancel");
	PENDING = false;	
	return;
}

// Extract & Resynthesize
function extractWavetable(file, targetPitch, targetNoteNumber, rrGroup, vl, vh)
{
	// Initialize
	PENDING = true;	
	if (worker.shouldAbort())
		abort();
	worker.setStatusMessage("Analyzing");
	worker.setProgress(0.05);		
	var wt;
	var buffer = file.loadAsAudioFile();
	var f0;		
	var output = [];

	// Analyze
	f0 = buffer.detectPitch(SAMPLERATE, buffer.length * 0.2, buffer.length * 0.6);			
	lorisManager.analyse(file, f0);	
	
	// Repitch
	TARGET = targetPitch;
	lorisManager.processCustom(file, repitch);
	
	// Resynthesize
	wt = lorisManager.synthesise(file);	
	wt = wt[0]; // Get the Buffer
	
	// Trim Buffer, 0.2s should be plenty
	//for (i=0; i<wt.length; i++) // KEEP ME
	for (i=0; i<10000; i++) // KEEP ME
	{
		output.push(wt[i]);
	}
			
	// Write to Audio File	
	
	// Current Format: rootHz_rootKeyNum_RRGroup_articulation.wav
	// ideal format: hz{}_root{}_rr{}_vl{}_vh{}_petName.wav
	var fileName = "hz" + Math.round(targetPitch) + "_root" + targetNoteNumber + "_rr" + Math.round(rrGroup + 1) + "_vl" + vl + "_vh" + vh + "_" + file.toString(3);
	var path = WAVETABLES.getChildFile(fileName);	
	saveAudio(path, output);	
	Console.print("Wrote to file");
	
	// End Worker
	worker.setProgress(1.0);
	PENDING = false;
}

function buildSampleMap(sampleMapName)
{
	/* namespace SampleIds */
	

	// XML Constants
	var sampleMapID = sampleMapName;
	var footer = '</samplemap>';
	
	// Sample Properties
	var prefix;
	var xmlFile = SAMPLEMAPS.getChildFile("wavetables.xml");
	var name;
	var path;
	var lowKey;
	var highKey;
	var lowVel = 1;
	var highVel = 127;	
	var rrGroup;
	var rootNote;
	var idx;
	var subString;
	var hz;
	var pitch;
	var sampleStart = 0;
	var loopStart;
	var loopEnd;
	var loopFade;		
	
	// Load and setup SampleMap
	var samples = FileSystem.findFiles(WAVETABLES, "*.wav", false);
	var sampleMapToLoad = SAMPLEMAPS.getChildFile("wavetables.xml");
			
	// Load Sample Map
	Sampler1.asSampler().loadSampleMap(sampleMapToLoad.toString(0));
	
	// Clear SampleMap (Make Sure it's empty)
	var selection = Sampler1.asSampler().createSelection(".*");
	for (s in selection)
		s.deleteSample();
	
	//for (sample in samples)
	for (i=0; i<samples.length; i++)
	{			
		// Grab File Name
		prefix = "{PROJECT_FOLDER}wavetables/";
		name = samples[i].toString(3);
		path = prefix + name;
		
		Console.print(path);
		
		// Parse RootNote as Int
		idx = name.indexOf("root") + 4;
		
		rootNote = name.substring(name.indexOf("_") + 1, name.indexOf("_") + 3);		
		rootNote = name.substring(idx, idx+2);
		rootNote = Math.round(rootNote);			
				
		// Calculate KeySpan
		if (rootNote == 12)
		{
			lowKey = rootNote;
			highKey = rootNote + 2;
		}
		if (rootNote == 88)
		{
			lowKey = rootNote - 3;
			highKey = rootNote;					
		}
		else
		{
			lowKey = rootNote - 2;
			highKey = rootNote + 2;	
		}
		
		// Calculate Single Cycle
		hz = Engine.getFrequencyForMidiNoteNumber(rootNote);		
		var cycle = Math.round(SAMPLERATE / hz);
		
		// Setup Loop
		// Pick any arbitrary Sample
		loopStart = 4000;
		loopEnd = loopStart + cycle;
		//loopFade = Math.round(cycle / 32); // TWEAK ME
		loopFade = 32;
		
		// Parse RR Group
		idx = name.indexOf("rr") + 2;
		subString = name.substring(idx, idx+10); // pad for RR Groups > 10
		rrGroup = subString.substring(0, subString.indexOf("_"));
		rrGroup = Math.round(rrGroup);			
		
		
		// Testing Sampler
		
		var importedSample = Sampler1.asSampler().importSamples([path], true);
		
		for (s in importedSample)
		{
			// LOW (IDK Why this needs to loop but it does)
			for (x = 3; x < 5; x++)
			{
				s.set(x, lowKey);
			}
					
			s.set(2, rootNote); // ROOT
			s.set(3, highKey); // HIGH

			s.set(5, lowVel); // VLOW
			s.set(6, highVel); // VHIGH
			
			
			
			s.set(15, loopStart); // loopStart
			s.set(16, loopEnd); // loopEnd
			s.set(17, loopFade); // loopFade
			s.set(18, 1); // loop Active
			
			s.set(7, rrGroup); // RR GROUP
			// 16-19: loopStart, loopEnd, loopFade, loopActive
		}
	}
	
}

// Press the big red button
inline function onButton1Control(component, value)
{
	if (value)
	{			
		if (EXTRACTWAVETABLES)
		{
			// Extract Wavetables
			local audioFiles = FileSystem.findFiles(ROOT, "*.wav", false);
			
			for (i=0; i<audioFiles.length; i++)
			{
				for (j=0; j<keyRange.length; j++)
				{
					Console.clear();
	
					local hz = Engine.getFrequencyForMidiNoteNumber(keyRange[j]);
					extractWavetable(audioFiles[i], hz, keyRange[j], i, 1, 127); // (file, f0, rootKey, rrGroup, velLow, velHigh)
					
					Console.print("Audio File: " + (i+1) + "/" + audioFiles.length);
					Console.print("Wavetable: " + (j+1) + "/" + keyRange.length);
				}			
			}									
			Console.clear();
			Console.print("Finished extracting Wavetables.");
		}
		if (BUILDSAMPLEMAP)
		{
			Console.print("Creating sampleMap");
			buildSampleMap("wavetable");	
		}
					
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
  EditorStates BodyShown 1 Visible 1 Solo 0 contentShown 1 onInitOpen 1  ChildProcessors   Content   UIData  ContentProperties DeviceType 	Desktop Component type ScriptButton id 	Button1 x 	     �g@y 	     @p@isMomentary 1 saveInPreset 0  Component type ScriptFloatingTile id FloatingTile1 x 	        y 	     �~@width X  height d   ContentType 
Keyboard bgColour 	ddd�    itemColour 	���    itemColour2 	����    textColour 	        Data ]{
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
}  Processor Type ModulatorChain ID GainModulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type ModulatorChain ID PitchModulation Bypassed Intensity 	        EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type EffectChain ID FX Bypassed EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors   Processor Type StreamingSampler ID 
Sampler1 Bypassed Gain 	      �?Balance 	        VoiceLimit 	      p@KillFadeTime 	      4@IconColour 0 PreloadSize 	      �@BufferSize 	      �@VoiceAmount 	      p@SamplerRepeatMode 	      @RRGroupAmount 	      @PitchTracking 	      �?OneShot 	        CrossfadeGroups 	        Purged 	        Reversed 	        NumChannels    UseStaticMatrix 	        Group0Table  Group1Table  Group2Table  Group3Table  Group4Table  Group5Table  Group6Table  Group7Table  EditorStates BodyShown 1 Visible 1 Solo 0 MapPanelShown 1 BigSampleMap 1 Folded 1 CrossfadeTableShown 0  ChildProcessors  Processor Type MidiProcessorChain ID Midi Processor Bypassed EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID GainModulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors  Processor Type AHDSR ID AHDSR Envelope1 Bypassed Monophonic 	        Retrigger 	      �?Intensity 	      �?AttackCurve 	        DecayCurve 	        Attack 	      @AttackLevel 	        Hold 	      $@Decay 	     ��@Sustain 	      Y�Release 	     ��@EcoMode 	      �?EditorStates BodyShown 1 Visible 1 Solo 0  ChildProcessors  Processor Type ModulatorChain ID Attack Time Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID Attack Level Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID Decay Time Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID Sustain Level Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID Release Time Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID PitchModulation Bypassed Intensity 	        EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type EffectChain ID FX Bypassed EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors  Processor 	Type PolyphonicFilter ID 	Filter1 Bypassed Gain 	        Frequency 	     ��@Q 	      �?Mode 	      @Quality 	        BipolarIntensity 	        EditorStates BodyShown 1 Visible 1 Solo 0  ChildProcessors  Processor Type ModulatorChain ID Frequency Modulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0  ChildProcessors  Processor Type AHDSR ID AHDSR Envelope2 Bypassed Monophonic 	        Retrigger 	      �?Intensity 	      �?AttackCurve 	        DecayCurve 	        Attack 	      @AttackLevel 	        Hold 	      $@Decay 	     ��@Sustain 	      Y�Release 	     ��@EcoMode 	      �?EditorStates BodyShown 1 Visible 1 Solo 0  ChildProcessors  Processor Type ModulatorChain ID Attack Time Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID Attack Level Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID Decay Time Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID Sustain Level Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID Release Time Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID Gain Modulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID Bipolar Freq Modulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID Q Modulation Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID Sample Start Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   Processor Type ModulatorChain ID Group Fade Bypassed Intensity 	      �?EditorStates BodyShown 1 Visible 0 Solo 0 Folded 1  ChildProcessors   RoutingMatrix NumSourceChannels    Channel0     Send0 ����Channel1    Send1 ���� channels  channelData enabled level 	        suffix   samplemap ID wavetables RRGroupAmount 6.0 MicPositions ; CrossfadeGamma 1.0 SaveMode 1 `sample Root /   LoKey -   HiKey 1   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz123_root47_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root /   LoKey -   HiKey 1   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz123_root47_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root /   LoKey -   HiKey 1   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz123_root47_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root /   LoKey -   HiKey 1   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz123_root47_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root /   LoKey -   HiKey 1   LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz123_root47_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root /   LoKey -   HiKey 1   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz123_root47_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root X   LoKey U   HiKey X   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz1319_root88_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root X   LoKey U   HiKey X   LoVel    HiVel    RRGroup    FileName K{PROJECT_FOLDER}wavetables/hz1319_root88_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root X   LoKey U   HiKey X   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz1319_root88_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root X   LoKey U   HiKey X   LoVel    HiVel    RRGroup    FileName K{PROJECT_FOLDER}wavetables/hz1319_root88_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root X   LoKey U   HiKey X   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz1319_root88_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root X   LoKey U   HiKey X   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz1319_root88_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root 4   LoKey 2   HiKey 6   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz165_root52_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root 4   LoKey 2   HiKey 6   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz165_root52_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root 4   LoKey 2   HiKey 6   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz165_root52_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root 4   LoKey 2   HiKey 6   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz165_root52_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root 4   LoKey 2   HiKey 6   LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz165_root52_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root 4   LoKey 2   HiKey 6   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz165_root52_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root    LoKey 
   HiKey    LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz16_root12_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd )  LoopXFade     LoopEnabled     sample Root    LoKey 
   HiKey    LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz16_root12_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd )  LoopXFade     LoopEnabled     sample Root    LoKey 
   HiKey    LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz16_root12_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd )  LoopXFade     LoopEnabled     sample Root    LoKey 
   HiKey    LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz16_root12_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd )  LoopXFade     LoopEnabled     sample Root    LoKey 
   HiKey    LoVel    HiVel    RRGroup    FileName F{PROJECT_FOLDER}wavetables/hz16_root12_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd )  LoopXFade     LoopEnabled     sample Root    LoKey 
   HiKey    LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz16_root12_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd )  LoopXFade     LoopEnabled     sample Root 9   LoKey 7   HiKey ;   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz220_root57_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd h  LoopXFade     LoopEnabled     sample Root 9   LoKey 7   HiKey ;   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz220_root57_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd h  LoopXFade     LoopEnabled     sample Root 9   LoKey 7   HiKey ;   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz220_root57_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd h  LoopXFade     LoopEnabled     sample Root 9   LoKey 7   HiKey ;   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz220_root57_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd h  LoopXFade     LoopEnabled     sample Root 9   LoKey 7   HiKey ;   LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz220_root57_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd h  LoopXFade     LoopEnabled     sample Root 9   LoKey 7   HiKey ;   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz220_root57_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd h  LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz22_root17_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz22_root17_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz22_root17_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz22_root17_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName F{PROJECT_FOLDER}wavetables/hz22_root17_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz22_root17_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root >   LoKey <   HiKey @   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz294_root62_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd 6  LoopXFade     LoopEnabled     sample Root >   LoKey <   HiKey @   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz294_root62_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd 6  LoopXFade     LoopEnabled     sample Root >   LoKey <   HiKey @   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz294_root62_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd 6  LoopXFade     LoopEnabled     sample Root >   LoKey <   HiKey @   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz294_root62_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd 6  LoopXFade     LoopEnabled     sample Root >   LoKey <   HiKey @   LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz294_root62_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd 6  LoopXFade     LoopEnabled     sample Root >   LoKey <   HiKey @   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz294_root62_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd 6  LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz29_root22_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz29_root22_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz29_root22_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz29_root22_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName F{PROJECT_FOLDER}wavetables/hz29_root22_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz29_root22_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root C   LoKey A   HiKey E   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz392_root67_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root C   LoKey A   HiKey E   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz392_root67_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root C   LoKey A   HiKey E   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz392_root67_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root C   LoKey A   HiKey E   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz392_root67_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root C   LoKey A   HiKey E   LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz392_root67_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root C   LoKey A   HiKey E   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz392_root67_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz39_root27_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz39_root27_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz39_root27_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz39_root27_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName F{PROJECT_FOLDER}wavetables/hz39_root27_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root    LoKey    HiKey    LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz39_root27_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root H   LoKey F   HiKey J   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz523_root72_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root H   LoKey F   HiKey J   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz523_root72_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root H   LoKey F   HiKey J   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz523_root72_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root H   LoKey F   HiKey J   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz523_root72_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root H   LoKey F   HiKey J   LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz523_root72_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root H   LoKey F   HiKey J   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz523_root72_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root     LoKey    HiKey "   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz52_root32_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root     LoKey    HiKey "   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz52_root32_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root     LoKey    HiKey "   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz52_root32_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root     LoKey    HiKey "   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz52_root32_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root     LoKey    HiKey "   LoVel    HiVel    RRGroup    FileName F{PROJECT_FOLDER}wavetables/hz52_root32_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root     LoKey    HiKey "   LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz52_root32_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root M   LoKey K   HiKey O   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz698_root77_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root M   LoKey K   HiKey O   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz698_root77_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root M   LoKey K   HiKey O   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz698_root77_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root M   LoKey K   HiKey O   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz698_root77_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root M   LoKey K   HiKey O   LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz698_root77_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root M   LoKey K   HiKey O   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz698_root77_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root %   LoKey #   HiKey '   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz69_root37_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root %   LoKey #   HiKey '   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz69_root37_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root %   LoKey #   HiKey '   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz69_root37_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root %   LoKey #   HiKey '   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz69_root37_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root %   LoKey #   HiKey '   LoVel    HiVel    RRGroup    FileName F{PROJECT_FOLDER}wavetables/hz69_root37_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root %   LoKey #   HiKey '   LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz69_root37_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd   LoopXFade     LoopEnabled     sample Root *   LoKey (   HiKey ,   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz92_root42_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd }  LoopXFade     LoopEnabled     sample Root *   LoKey (   HiKey ,   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz92_root42_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd }  LoopXFade     LoopEnabled     sample Root *   LoKey (   HiKey ,   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz92_root42_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd }  LoopXFade     LoopEnabled     sample Root *   LoKey (   HiKey ,   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz92_root42_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd }  LoopXFade     LoopEnabled     sample Root *   LoKey (   HiKey ,   LoVel    HiVel    RRGroup    FileName F{PROJECT_FOLDER}wavetables/hz92_root42_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd }  LoopXFade     LoopEnabled     sample Root *   LoKey (   HiKey ,   LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz92_root42_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd }  LoopXFade     LoopEnabled     sample Root R   LoKey P   HiKey T   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz932_root82_rr1_vl1_vh127_01_bridgeLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root R   LoKey P   HiKey T   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz932_root82_rr2_vl1_vh127_02_bridgeRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root R   LoKey P   HiKey T   LoVel    HiVel    RRGroup    FileName I{PROJECT_FOLDER}wavetables/hz932_root82_rr3_vl1_vh127_03_middleLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root R   LoKey P   HiKey T   LoVel    HiVel    RRGroup    FileName J{PROJECT_FOLDER}wavetables/hz932_root82_rr4_vl1_vh127_04_middleRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root R   LoKey P   HiKey T   LoVel    HiVel    RRGroup    FileName G{PROJECT_FOLDER}wavetables/hz932_root82_rr5_vl1_vh127_05_neckLeft.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     sample Root R   LoKey P   HiKey T   LoVel    HiVel    RRGroup    FileName H{PROJECT_FOLDER}wavetables/hz932_root82_rr6_vl1_vh127_06_neckRight.wav Duplicate LoopStart �  LoopEnd �  LoopXFade     LoopEnabled     RoutingMatrix NumSourceChannels    Channel0     Send0 ����Channel1    Send1 ���� macro_controls  macro name 	Macro 1 value 	        midi_cc ���� macro name 	Macro 2 value 	        midi_cc ���� macro name 	Macro 3 value 	        midi_cc ���� macro name 	Macro 4 value 	        midi_cc ���� macro name 	Macro 5 value 	        midi_cc ���� macro name 	Macro 6 value 	        midi_cc ���� macro name 	Macro 7 value 	        midi_cc ���� macro name 	Macro 8 value 	        midi_cc ���� MidiAutomation   MPEData Enabled  