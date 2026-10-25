from flask import Flask, render_template

# Initialize the Flask application
app = Flask(__name__)

# Route for the Home/Game page
@app.route('/')
def index():
    # Flask looks inside the 'templates' folder automatically for this file
    return render_template('index.html')

# Run the local development server
if __name__ == '__main__':
    # debug=True automatically reloads the page when you save code changes
    app.run(debug=True, port=5000)
