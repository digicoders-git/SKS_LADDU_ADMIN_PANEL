// src/apis/orders.js
import http from "./http";

// GET /orders  (admin list)
export const listOrders = async () => {
  const { data } = await http.get("/orders");
  // backend: { orders: [...] } ya direct array
  return Array.isArray(data) ? data : data.orders || [];
};

// PUT /orders/:orderId/status  (admin update status)
export const updateOrderStatus = async (orderId, status) => {
  const { data } = await http.put(`/orders/${orderId}/status`, {
    status,
  });
  return data;
};




// {/* <section ref={addToRefs} className="scroll-section py-20 px-8 md:px-24 bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-surface)] relative overflow-hidden" id="media-coverage">
//   {/* Background Decorations */}
//   <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
//     <div className="absolute top-10 left-10 w-32 h-32 bg-[var(--color-secondary)] rounded-full blur-3xl"></div>
//     <div className="absolute bottom-20 right-20 w-40 h-40 bg-[var(--color-secondary)] rounded-full blur-3xl"></div>
//   </div>

//   <div className="max-w-7xl mx-auto relative z-10">
//     {/* Section Header */}
//     <div className="text-center mb-16">
//       <div className="inline-block px-4 py-1.5 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-6 border border-[var(--color-secondary)]/20">
//         Media Coverage
//       </div>
//       <h2 className="text-4xl md:text-7xl font-bold text-[var(--color-secondary)] mb-6 font-[var(--font-heading)] drop-shadow-sm">
//         As Seen On
//       </h2>
//       <p className="text-lg md:text-2xl text-gray-300 italic max-w-3xl mx-auto leading-relaxed">
//         Discover why food lovers and media personalities across India are raving about our authentic <SKSBrand /> Laddus
//       </p>
//     </div>

//     {/* Video Grid */}
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
//       {/* Video 1 */}
//       <div className="group bg-[var(--color-muted)] rounded-[30px] overflow-hidden shadow-2xl border border-[var(--color-secondary)]/10 hover:border-[var(--color-secondary)]/40 transition-all duration-500 hover:-translate-y-2">
//         <div className="aspect-video relative overflow-hidden bg-black">
//           <iframe
//             className="w-full h-full"
//             src="https://www.youtube.com/embed/03sUU0xzCnM?autoplay=1&mute=1&loop=1&playlist=03sUU0xzCnM&enablejsapi=1"
//             title="SKS Laddu Featured Video 1"
//             frameBorder="0"
//             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//             allowFullScreen
//             id="youtube-video-1"
//           ></iframe>
//         </div>
//       </div>

//       {/* Video 2 */}
//       <div className="group bg-[var(--color-muted)] rounded-[30px] overflow-hidden shadow-2xl border border-[var(--color-secondary)]/10 hover:border-[var(--color-secondary)]/40 transition-all duration-500 hover:-translate-y-2">
//         <div className="aspect-video relative overflow-hidden bg-black">
//           <iframe
//             className="w-full h-full"
//             src="https://www.youtube.com/embed/ea5YwPwTlLE?autoplay=1&mute=1&loop=1&playlist=ea5YwPwTlLE&enablejsapi=1"
//             title="SKS Laddu Featured Video 2"
//             frameBorder="0"
//             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//             allowFullScreen
//             id="youtube-video-2"
//           ></iframe>
//         </div>
//       </div>

//       {/* Video 3 */}
//       <div className="group bg-[var(--color-muted)] rounded-[30px] overflow-hidden shadow-2xl border border-[var(--color-secondary)]/10 hover:border-[var(--color-secondary)]/40 transition-all duration-500 hover:-translate-y-2">
//         <div className="aspect-video relative overflow-hidden bg-black">
//           <iframe
//             className="w-full h-full"
//             src="https://www.youtube.com/embed/QavZkjDbm7w?autoplay=1&mute=1&loop=1&playlist=QavZkjDbm7w"
//             title="SKS Laddu Featured Short"
//             frameBorder="0"
//             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//             allowFullScreen
//             id="youtube-video-3"
//           ></iframe>
//         </div>
//       </div>
//     </div>

//     {/* Call to Action */}
//     <div className="text-center mt-16">
//       <p className="text-xl md:text-2xl text-zinc-400 mb-8 font-medium">
//         Join thousands of satisfied customers who trust <SKSBrand /> for authentic sweetness
//       </p>
//       <Link
//         to="/laddus"
//         className="inline-block px-10 py-4 bg-[var(--color-secondary)] text-[var(--color-primary)] rounded-full font-bold text-lg shadow-2xl hover:scale-105 transition-transform"
//       >
//         Order Your Laddus Now
//       </Link>
//     </div>
//   </div>
// </section> */}
