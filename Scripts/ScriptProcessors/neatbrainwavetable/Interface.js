Content.makeFrontInterface(600, 600);

// FOLDER STRUCTURE
const AUDIOFILES = FileSystem.getFolder(FileSystem.AudioFiles);
const SAMPLES = FileSystem.getFolder(FileSystem.Samples);
const SAMPLEMAPS = FileSystem.getFolder(FileSystem.Samples).getParentDirectory().getChildFile("sampleMaps");
const Sampler1 = Synth.getChildSynth("Sampler1");

const SAMPLES_RESIDUE = SAMPLES.createDirectory("residue");
const SAMPLES_WAVEGUIDE = SAMPLES.createDirectory("waveguide");
const SAMPLES_FX = SAMPLES.createDirectory("fx");

// HYPERPAMETERS
const EXTRACT_RESIDUE = false;
const EXTRACT_SUSTAIN = false;
const EXTRACT_PALMMUTE = false;
const EXTRACT_NATURALHARMONIC = false;
const EXTRACT_PINCHHARMONIC = false;

const BUILDSAMPLEMAP = true;
const USEMANUALTUNING = false;

const PITCH_START = 0.1;
const PITCH_END = 0.8;
const TRIM_START = 0.05;
const TRIM_END = 0.7;
const LOOP_START = 0.3;
const FADE_TIME = 15;
const SAMPLERATE = 44100.0;
const NUM_ROUNDROBINS = 15;
const keyRange = [12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 88];
reg PENDING = false;
reg TARGET = 440.0;

// TUNINGS
//const MANUAL_TUNING = 659.4; //gtr e string 12
//const MANUAL_TUNING = 1318.8; //gtr e string 24
//const MANUAL_TUNING = 87.2; // bs c string 5
const MANUAL_TUNING = 130.8; // bs c string 12

// INCLUDES
include("lorisFunctions.js");
include("sampleMapFunctions.js");
// INTERFACE
inline function onbtnExtractWaveguidesControl(component, value)
{
	if (value)
	{
		local audioFiles = FileSystem.findFiles(AUDIOFILES, "*.wav", false);
		for (i=0; i<audioFiles.length; i++) // For each audio file
		{
			for (j=0; j<keyRange.length; j++) // For each registered key
			{
				Console.clear();
				local targetPitch = Engine.getFrequencyForMidiNoteNumber(keyRange[j]);
				extractAllWavetables(audioFiles[i], targetPitch, keyRange[j], i);					
				Console.print("Audio File: " + (i+1) + "/" + audioFiles.length);
				Console.print("Wavetable: " + (j+1) + "/" + keyRange.length);
			}		
		}									
		Console.clear();
		Console.print("Finished extracting Wavetables.");

		// Set the RR Groups here to avoid crash
		Sampler1.setAttribute(Sampler1.RRGroupAmount, NUM_ROUNDROBINS);

		//buildSampleMap("residue"); // DONT FORGET ME 
		buildSampleMap("sustain");
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
 