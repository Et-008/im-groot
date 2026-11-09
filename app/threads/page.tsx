
export default function Home() {
    return (
        <div className="p-10 max-w-[65%] m-auto">
            <h1>I'm Groot</h1>

            <ConversationBubble type='host'>How does the Self checkout in decathlon technology work?</ConversationBubble>
            <ConversationBubble>Decathlon’s self-checkout is built on RFID (Radio-Frequency Identification), which is why you don’t scan anything item by item.

                1. RFID tags on products
                Decathlon attaches or embeds a small RFID tag (a tiny chip plus antenna, often in the price label or sewn into the product) on most of its items. Each tag stores a unique ID that links to that product in the store’s inventory system.

                2. Placing items at the kiosk
                At the self-checkout, you put all your items together in a tray or on a designated pad or bin. They don’t need to be lined up or barcode-facing, and they can even be piled on top of each other.

                3. Bulk reading
                The kiosk has RFID antennas that emit radio waves. These energize the passive tags (they have no battery), and each tag responds with its ID. The reader picks up every tag in the tray within a second or two.

                4. Matching to the database
                The system looks up each ID to get the product name, size and price, applies any current discounts, and shows your itemized total on screen. You can check that the count matches what you put in.

                5. Payment and deactivation
                You pay by card or mobile payment. Once the payment completes, the system flags those tags as “sold” in the database, so the anti-theft gates at the exit won’t trigger an alarm.

                Why Decathlon uses it

                Speed: checkout takes seconds instead of minutes, even for a full basket.
                Fewer staff on the till: employees can spend more time on the shop floor helping customers.
                Inventory accuracy: the same tags let staff do fast stock counts by walking through with a handheld reader.
                Loss prevention: the same tags also serve as the security system at the exit.

                Limitations

                Metal and liquids can interfere with radio signals, so some items may need special tags or handling.
                Very bulky items (like bikes or tents) or items without tags may need a staff member or manual scanning.
                If an item is missed, the kiosk usually prompts you to rescan or ask for help.

                Decathlon was among the early large retailers to adopt RFID across almost its entire range, and the kiosks and details vary somewhat by country and store. If you’d like specifics for the stores near you, I can look up current information.</ConversationBubble>

            <ConversationBubble type='host'>How does RFID tech work?</ConversationBubble>

            <ConversationBubble>RFID is a way of identifying objects wirelessly using radio waves. A system has three main parts: a tag, a reader, and software behind them.

                The tag
                A tag has two components: a tiny microchip that stores a unique ID (and sometimes a little extra data), and an antenna, usually a thin coil or strip of metal, printed or etched onto a flexible label. Most retail tags are passive, meaning they have no battery at all.

                The reader
                The reader has its own antenna and a radio transmitter/receiver. It constantly sends out radio signals and listens for replies.

                How a read happens

                The reader emits a radio signal. This creates an electromagnetic field around its antenna.
                The tag’s antenna captures that energy. The field induces a small electrical current in the antenna, just enough to power up the chip for a few milliseconds.
                The chip responds. It sends its ID back by changing how its antenna reflects the signal, a technique called backscatter. Think of it as the tag “blinking” a coded pattern back at the reader instead of broadcasting its own signal.
                The reader decodes the reply and passes the ID to software, which looks up what that ID represents (a product, a pallet, a person’s access card, and so on).

                Handling many tags at once
                When many tags are in range, they could all reply at the same time and garble each other. RFID uses anti-collision protocols: the reader essentially asks tags to respond in separate time slots or sorts them by ID bits, so hundreds of tags can be read in a second or so. This is what lets a whole basket be read without scanning items individually.

                Frequency bands
                Different frequencies suit different jobs:

                Band	Typical range	Common uses
                Low frequency (LF, ~125-134 kHz)	A few cm	Animal implants, some door locks
                High frequency (HF, 13.56 MHz)	Up to ~1 m	NFC, access cards, library books, payment cards
                Ultra-high frequency (UHF, ~860-960 MHz)	Several meters	Retail inventory, logistics, checkout kiosks

                Retail systems like Decathlon’s use UHF because it offers longer range and fast bulk reading.

                Passive vs. active tags

                Passive: no battery, cheap (cents each), range up to several meters. This is what retail uses.
                Active: has its own battery and transmitter, with a range of tens to hundreds of meters, but costs far more. Used for things like tracking shipping containers or toll systems.

                RFID vs. barcodes
                Barcodes need line of sight and one-at-a-time scanning, and every item of the same product shares the same code. RFID needs no line of sight, reads many items at once, and gives each individual item a unique ID.

                Limitations
                Metal reflects radio waves and liquids absorb them, both of which can weaken or block reads. Tags also cost more than printed barcodes, though prices have dropped a lot.

                If you're curious, I can go deeper on any part, such as how NFC on your phone relates to RFID.</ConversationBubble>

        </div>
    );
}


function ConversationBubble({ type = 'bot', children }: { type?: 'host' | 'bot', children: any }) {

    return (
        <div className={`group flex border p-2 border-r-1 rounded-2xl max-w-[70%] mb-10 ${type === 'host' ? 'ml-auto bg-gray-500' : ''}`}>
            {children}
            {type === 'host' ? <button className="hidden group-hover:block text-xs ml-auto">Branch out</button> : <></>}
        </div>)
}