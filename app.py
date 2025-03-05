from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/booking')
def booking():
    return render_template('booking.html')

@app.route('/rental-terms')
def rental_terms():
    return render_template('rental_terms.html')

if __name__ == '__main__':
    app.run(debug=True)