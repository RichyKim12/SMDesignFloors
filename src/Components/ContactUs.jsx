
import "./Home.css"
import Navbar from "./Navbar";
import "./ContactUs.css";

function ContactUs() {

    const hours = [
        { day: "Mon", time: "9:00AM – 5:00PM" },
        { day: "Tue", time: "9:00AM – 5:00PM" },
        { day: "Wed", time: "9:00AM – 5:00PM" },
        { day: "Thu", time: "9:00AM – 5:00PM" },
        { day: "Fri", time: "9:00AM – 5:00PM" },
        { day: "Sat", time: "10:00AM – 4:00PM" },
        { day: "Sun", time: "Closed" },
    ];
    return (
        <div className="home-container">
            <Navbar />
            <div className="container">
                {/* Right Side: Request Form */}
                <div className="left">
                    <h2>Request Estimate</h2>
                    <p>
                        <strong>Let one of our experts help you find the perfect floor!</strong>
                    </p>

                    <form action="/submit-estimate" method="POST">
                        <p>📍 Woodbridge, VA</p>

                        <div className="form-row">
                            <label htmlFor="name" className="visually-hidden">
                                Name
                            </label>
                            <input type="text" id="name" name="name" placeholder="Name" required />

                            <label htmlFor="email" className="visually-hidden">
                                Email
                            </label>
                            <input type="email" id="email" name="email" placeholder="Email" required />
                        </div>

                        <div className="form-row">
                            <label htmlFor="phone" className="visually-hidden">
                                Phone Number
                            </label>
                            <input type="tel" id="phone" name="phone" placeholder="Phone Number" />

                            <label htmlFor="zip" className="visually-hidden">
                                ZIP code
                            </label>
                            <input type="text" id="zip" name="zip" placeholder="ZIP code" />
                        </div>

                        <label htmlFor="message" className="visually-hidden">
                            Message
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            placeholder="Tell us what you are looking for"
                        ></textarea>

                        <button type="submit">Get Estimate</button>
                    </form>
                </div>
                {/* Left Side: Contact Info */}
                <div className="right">
                    <h2>Contact Info</h2>
                    <p>Our address, contact details and store hours:</p>
                    <h3>Fairfax, VA</h3>

                    <p>📍 2807-A Merilee Drive, Fairfax, VA 22031</p>
                    <p>📞 703-560-6300</p>

                    <ul className="hours">
                        {hours.map(({ day, time }) => (
                            <li key={day}>
                                {day} {time}
                            </li>
                        ))}
                    </ul>
                </div>



            </div>
        </div>
    );
};

export default ContactUs