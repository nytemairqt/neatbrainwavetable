Content.makeFrontInterface(600, 600);

// HYPERPAMETERS
const MULTISTRING = false;
const EXTRACTWAVETABLES = false;
const EXTRACTRESIDUES = false;
const BUILDSAMPLEMAP = false;
const WG_FOLDER = "leftWG";
const RS_FOLDER = "leftRS";
const PITCH_START = 0.2;
const PITCH_END = 0.5;
const TRIM_START = 0.05;
const TRIM_END = 0.5;
const LOOP_START = 0.3;
const FADE_TIME = 15;

// GLOBALS
const SAMPLERATE = 44100.0;
reg PENDING = false;
const MIDDLE_C = 261.63;
const HIGH_E = 659.25;
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
 