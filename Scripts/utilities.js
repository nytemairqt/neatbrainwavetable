inline function checkRRGroup(fileName)
{
	// Parses the fileName and returns the round-robin group for residue recombination

	local rrStringIndex = fileName.indexOf("rr");
	local rrGroup = fileName.substring(rrStringIndex, fileName.length);
	rrStringIndex = rrGroup.indexOf("_");
	rrGroup = rrGroup.substring(0, rrStringIndex);	

	switch (rrGroup)
	{
		case "rr1":
			rrGroup = "rr01";
			break;
		case "rr2":
			rrGroup = "rr02";
			break;
		case "rr3":
			rrGroup = "rr03";
			break;
		case "rr4":
			rrGroup = "rr04";
			break;
		case "rr5":
			rrGroup = "rr05";
			break;	
		case "rr6":
			rrGroup = "rr06";
			break;
		case "rr7":
			rrGroup = "rr07";
			break;	
		case "rr8":
			rrGroup = "rr08";
			break;		
		case "rr9":
			rrGroup = "rr09";
			break;				
		default:
			break;												
	}
	return rrGroup;
}
