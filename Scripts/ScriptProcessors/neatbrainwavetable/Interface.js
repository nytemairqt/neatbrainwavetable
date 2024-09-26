Content.makeFrontInterface(600, 600);

// HYPERPAMETERS
const EXTRACTWAVETABLES = true;
const EXTRACTRESIDUES = false;
const BUILDSAMPLEMAP = false;
const USEMANUALTUNING = false;
const DAMPENUPPERREGISTER = true; // test implementation

const WG_FOLDER = "dampentest";
const RS_FOLDER = "leftRS";

const PITCH_START = 0.1;
const PITCH_END = 0.8;
const TRIM_START = 0.05;
const TRIM_END = 0.7;
const LOOP_START = 0.3;
const FADE_TIME = 15;

//const MANUAL_TUNING = 659.4; //gtr e string 12
//const MANUAL_TUNING = 1318.8; //gtr e string 24
//const MANUAL_TUNING = 87.2; // bs c string 5
const MANUAL_TUNING = 130.8; // bs c string 12

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

inline function onbtnExtractWaveguidesControl(component, value)
{
	if (value)
	{
		// Create Directories
		local WG_SAMPLES = SAMPLES.createDirectory(WG_FOLDER);
		local RS_SAMPLES = SAMPLES.createDirectory(RS_FOLDER);
		local audioFiles = FileSystem.findFiles(AUDIOFILES, "*.wav", false);
		
		// Main Loop
		for (i=0; i<audioFiles.length; i++) // For each audio file
		{
			for (j=0; j<keyRange.length; j++) // For each registered key
			{
				//Console.clear();
				local hz = Engine.getFrequencyForMidiNoteNumber(keyRange[j]);
				extractWavetable(audioFiles[i], hz, keyRange[j], i, 1, 127, WG_SAMPLES, RS_SAMPLES);					
				Console.print("Audio File: " + (i+1) + "/" + audioFiles.length);
				Console.print("Wavetable: " + (j+1) + "/" + keyRange.length);
			}		
		}									
		//Console.clear();
		Console.print("Finished extracting Wavetables.");
		buildSampleMap(WG_SAMPLES);					
	}	
};

Content.getComponent("btnExtractWaveguides").setControlCallback(onbtnExtractWaveguidesControl);



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
 