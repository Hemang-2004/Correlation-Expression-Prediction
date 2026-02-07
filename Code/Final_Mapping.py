import json

def update_header_mapping(input_file, output_file):
    with open(input_file, 'r') as f:
        m = json.load(f)

    # 2. Merge Alkalinity keys
    if "PHENOLPTHALEINALKALINITY" in m:
        m.setdefault("PHENOLPHTHALEINALKALINITY", []).extend(m.pop("PHENOLPTHALEINALKALINITY"))

    # 4. Merge Fecal Streptococci
    if "FECALSTREPTOCOCCIMPN100ML" in m:
        m.setdefault("FECALSTREPTOCOCCI", []).extend(m.pop("FECALSTREPTOCOCCIMPN100ML"))

    # 5. Merge CAASCA and CALCIUMASCA into a new 'CALCIUM_TOTAL' or existing key
    # Let's move CALCIUMASCA into CAASCA as requested
    if "CALCIUMASCA" in m:
        m.setdefault("CAASCA", []).extend(m.pop("CALCIUMASCA"))

    # 6. Merge Lead
    if "LEADMGL" in m:
        m.setdefault("LEAD", []).extend(m.pop("LEADMGL"))

    # 7. Merge MAGNESIUMASMG into MG
    if "MAGNESIUMASMG" in m:
        m.setdefault("MG", []).extend(m.pop("MAGNESIUMASMG"))

    # 8. Turbidity Logic
    # Move 'Turbidity NTU' from TURBIDITYNTU into a dedicated TURBIDITY_NTU key
    # Move 'Turbidity (NTU)' from TURBIDITY into TURBIDITY_NTU
    # Keep 'Turbidity (mg/L)' in its own TURBIDITY_MGL key
    ntu_list = []
    mgl_list = []
    
    if "TURBIDITYNTU" in m:
        ntu_list.extend(m.pop("TURBIDITYNTU"))
        
    if "TURBIDITY" in m:
        old_turb = m.pop("TURBIDITY")
        for item in old_turb:
            if "NTU" in item:
                ntu_list.append(item)
            elif "mg/L" in item:
                mgl_list.append(item)
    
    if ntu_list: m["TURBIDITY_NTU"] = ntu_list
    if mgl_list: m["TURBIDITY_MGL"] = mgl_list

    # Deduplicate lists just in case
    for key in m:
        m[key] = list(set(m[key]))

    with open(output_file, 'w') as f:
        json.dump(m, f, indent=4)
    
    print(f"Updated mapping saved to {output_file}")

if __name__ == "__main__":
    update_header_mapping('header_mapping.json', 'refined_header_mapping.json')