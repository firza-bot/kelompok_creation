import sys
import json

def safe_json(data):
    print(json.dumps(data, ensure_ascii=True))
    sys.exit(0)

def main():
    if len(sys.argv) < 4:
        safe_json({"error": "Usage: python deep_trainer.py <sub_id> <selected_model> <task_type>"})
        
    sub_id = sys.argv[1]
    selected_model = sys.argv[2]
    task_type = sys.argv[3]
    
    # Dummy deep learning training simulation
    safe_json({
        "success": True,
        "metrics": {
            "accuracy": 0.92,
            "loss": 0.15,
            "val_accuracy": 0.90,
            "val_loss": 0.18
        },
        "history": {
            "accuracy": [0.70, 0.82, 0.88, 0.90, 0.92],
            "val_accuracy": [0.68, 0.80, 0.86, 0.89, 0.90]
        },
        "model_path": f"models/model_{sub_id}.h5"
    })

if __name__ == "__main__":
    main()
