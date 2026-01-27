import openpyxl

def parse_metadata_excel(excel_file):
    """
    Reads a metadata Excel file (uploaded) and extracts metadata fields.
    Matches the layout shown in your screenshot.
    """

    wb = openpyxl.load_workbook(excel_file, data_only=True)
    sheet = wb.active

    # Mapping Excel row → field name
    mapping = {
        1: "intended_reaction",
        2: "catalyst_id",
        3: "catalyst_composition",
        4: "electrode_material",
        5: "electrode_area",
        6: "catalyst_loading",
        7: "catalyst_morphology",
        8: "catalyst_structure",
        9: "electrolyte",
        10: "nitrogen_purging_time",
        11: "electrolyte_pH",
        12: "temperature",
        13: "reference_electrode",
        14: "scan_rate",
        15: "cycles",
        16: "potential_range",
        17: "ir_compensation",
        18: "rhe_conversion",
        19: "initial_conditioning",
        20: "current_density_reported",
        21: "forward_scan_note",
        22: "triplicate_measurements",
        23: "reference_electrode_testing",
        24: "article_doi",
        25: "article_link",
    }

    result = {}

    for row, field_name in mapping.items():
        cell_value = sheet[f"B{row}"].value
        result[field_name] = cell_value if cell_value is not None else ""

    return result
