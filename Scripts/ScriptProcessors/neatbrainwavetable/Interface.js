Content.makeFrontInterface(600, 600);

// FOLDERS
const AUDIOFILES = FileSystem.getFolder(FileSystem.AudioFiles);
const SAMPLES = FileSystem.getFolder(FileSystem.Samples);
const SAMPLEMAPS = FileSystem.getFolder(FileSystem.Samples).getParentDirectory().getChildFile("sampleMaps");
const Sampler1 = Synth.getChildSynth("Sampler1");

// STEREO SUPPORT
const SAMPLES_RESIDUE_LEFT = SAMPLES.createDirectory("rsLeft");
const SAMPLES_RESIDUE_RIGHT = SAMPLES.createDirectory("rsRight");
const SAMPLES_WAVEGUIDE_LEFT = SAMPLES.createDirectory("wgLeft");
const SAMPLES_WAVEGUIDE_RIGHT = SAMPLES.createDirectory("wgRight");
const SAMPLES_FX_LEFT = SAMPLES.createDirectory("fxLeft");
const SAMPLES_FX_RIGHT = SAMPLES.createDirectory("fxRight");

// HYPERPAMETERS
const EXTRACT_RESIDUE = false;
const EXTRACT_SUSTAIN = false;
const EXTRACT_PALMMUTE = true;
const EXTRACT_NATURALHARMONIC = false;
const EXTRACT_PINCHHARMONIC = false;
const EXTRACT_HAMMER = false;
const USEMANUALTUNING = true;
const STEREO_INSTRUMENT = false;

const PITCH_START = 0.1;
const PITCH_END = 0.8;
const TRIM_START = 0.05;
const TRIM_END = 0.7;
const LOOP_START = 0.3;
const FADE_TIME = 15;
const SAMPLERATE = 44100.0;
const NUM_ROUNDROBINS = 15;
//const keyRange = [12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 88];
const keyRange = [42];
reg PENDING = false;
reg TARGET = 440.0;

// TUNINGS
//const MANUAL_TUNING = 55.0; // bass guitar
const MANUAL_TUNING = 82.0;

// INCLUDES
include("lorisFunctions.js");

// INTERFACE
inline function onbtnExtractWaveguidesControl(component, value)
{
	if (!value)
		return;
	else
	{
		// Left Side (Or Mono)
		local audioFiles = FileSystem.findFiles(AUDIOFILES.getChildFile("left"), "*.wav", false);
		//for (i=0; i<audioFiles.length; i++) // For each audio file
		for (i=0; i<5; i++)
		{
			for (j=0; j<keyRange.length; j++) // For each registered key
			{
				Console.clear();
				local targetPitch = Engine.getFrequencyForMidiNoteNumber(keyRange[j]);
				extractAllWavetables(audioFiles[i], targetPitch, keyRange[j], i, false); // left side
				Console.print("Audio File: " + (i+1) + "/" + audioFiles.length);
				Console.print("Wavetable: " + (j+1) + "/" + keyRange.length);
			}		
		}									
		Console.clear();
		Console.print("Finished extracting left waveguides.");

		if (STEREO_INSTRUMENT)
		{
			// Right Side
			local audioFiles = FileSystem.findFiles(AUDIOFILES.getChildFile("right"), "*.wav", false);
			for (i=0; i<audioFiles.length; i++) // For each audio file
			{
				for (j=0; j<keyRange.length; j++) // For each registered key
				{
					Console.clear();
					local targetPitch = Engine.getFrequencyForMidiNoteNumber(keyRange[j]);
					extractAllWavetables(audioFiles[i], targetPitch, keyRange[j], i, true); // left side
					Console.print("Audio File: " + (i+1) + "/" + audioFiles.length);
					Console.print("Wavetable: " + (j+1) + "/" + keyRange.length);
				}		
			}									
			Console.clear();
			Console.print("Finished extracting left waveguides.");
		}
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
 