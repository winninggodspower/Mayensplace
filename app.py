import os
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
import paypalrestsdk
from dotenv import load_dotenv

app = Flask(__name__)
app.secret_key = 'your_secret_key'

load_dotenv() # Load environment variables from .env file

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///events.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# PayPal configuration
paypalrestsdk.configure({
    "mode": "sandbox",  # Change to "live" for production
    "client_id": os.getenv("PAYPAL_CLIENT_ID"),
    "client_secret": os.getenv("PAYPAL_CLIENT_SECRET")
})

# Event model
class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    organization = db.Column(db.String(100), nullable=True)
    address = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    event_name = db.Column(db.String(100), nullable=False)
    event_type = db.Column(db.String(100), nullable=False)
    event_date = db.Column(db.String(20), nullable=False)
    event_time = db.Column(db.String(50), nullable=False)
    guest_count = db.Column(db.Integer, nullable=False)
    additional_services = db.Column(db.Text, nullable=True)
    total_price = db.Column(db.Float, nullable=False)
    payment_status = db.Column(db.String(20), nullable=False, default="Pending")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/booking')
def booking():
    return render_template('booking.html')

@app.route('/rental-terms')
def rental_terms():
    return render_template('rental_terms.html')

def calculate_total_price(event_time, price_per_hour=200):
    """
    Calculate the total price based on the event time and price per hour.
    """
    try:
        start_time, end_time = event_time.split(" - ")
        start_hour = int(start_time.split(":")[0])
        end_hour = int(end_time.split(":")[0])
        if end_hour <= start_hour:
            raise ValueError("End time must be later than start time.")
        total_hours = end_hour - start_hour
        return total_hours * price_per_hour
    except Exception as e:
        raise ValueError(f"Invalid time format or calculation error: {str(e)}")

@app.route('/process-payment', methods=['POST'])
def process_payment():
    try:
        # Parse data from the request
        data = request.get_json()

        # Required fields
        required_fields = [
            'name', 'address', 'email', 'phone', 'event_name', 
            'event_type', 'event_date', 'event_time', 'guest_count'
        ]

        # Validate required fields
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return {"error": f"Missing required fields: {', '.join(missing_fields)}"}, 400

        # Extract data
        name = data.get('name')
        organization = data.get('organization')
        address = data.get('address')
        email = data.get('email')
        phone = data.get('phone')
        event_name = data.get('event_name')
        event_type = data.get('event_type')
        event_date = data.get('event_date')
        event_time = data.get('event_time')
        guest_count = data.get('guest_count')
        additional_services = data.get('additional_services')

        # Calculate total price
        try:
            total_price = calculate_total_price(event_time)
        except ValueError as e:
            return {"error": str(e)}, 400

        # Save event details to the database
        event = Event(
            name=name,
            organization=organization,
            address=address,
            email=email,
            phone=phone,
            event_name=event_name,
            event_type=event_type,
            event_date=event_date,
            event_time=event_time,
            guest_count=int(guest_count),
            additional_services=additional_services,
            total_price=total_price,
            payment_status="Pending"
        )
        db.session.add(event)
        db.session.commit()

        # Create PayPal payment
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": url_for('payment_success', event_id=event.id, _external=True),
                "cancel_url": url_for('payment_cancel', event_id=event.id, _external=True)
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": f"Booking for {event.event_date} at {event.event_time}",
                        "sku": "001",
                        "price": total_price,
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "total": str(total_price),
                    "currency": "USD"
                },
                "description": f"Booking for {event.event_date} at {event.event_time}"
            }]
        })

        if payment.create():
            for link in payment.links:
                if link.rel == "approval_url":
                    return {"approval_url": link.href}, 200
        else:
            return {"error": payment.error}, 400
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/payment-success')
def payment_success():
    payment_id = request.args.get('paymentId')
    payer_id = request.args.get('PayerID')
    event_id = request.args.get('event_id')
    

    payment = paypalrestsdk.Payment.find(payment_id)

    if payment.execute({"payer_id": payer_id}):
        # Update payment status in the database
        event = Event.query.get(event_id)
        if event:
            event.payment_status = "Successful"
            db.session.commit()

        print('payment successful')
        flash("Payment successful! Your booking has been confirmed.", "success")
        return redirect(url_for('index'))
    else:
        flash(f"Payment execution failed: {payment.error}", "danger")
        return redirect(url_for('booking'))

@app.route('/payment-cancel')
def payment_cancel():
    event_id = request.args.get('event_id')

    # Update payment status in the database
    event = Event.query.get(event_id)
    if event:
        event.payment_status = "Canceled"
        db.session.commit()

    flash("Payment was canceled.", "warning")
    return redirect(url_for('booking'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Ensure the database and tables are created
    app.run(debug=True)