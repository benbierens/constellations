using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Prototyping
{
    public class ContentStarExample
    {
        private readonly byte[] TarOfSeveralPhotos = new byte[1];
        private readonly byte[] TarOfEvenMorePhotos = new byte[1];

        /// <summary>
        /// ContentStars are not supposed to be used in isolation.
        /// This is to demonstrate what they can do.
        /// </summary>
        public void Example()
        {
            // I'm running a constellation node.
            // I'm setting up a single star to share a tarred folder of photos with a friend.

            // Setting up:
            var myId = new NodeId();
            var id = new StarId();
            var info = new StarInfo(id)
            {
                Owners = [myId], // I'm the owner. I can appoint/revoke Controllers. But Owners cannot be edited after creation.
                Type = "content_tarred_photos" // Something the app built on top of Constellations will understand.
            };
            var star = new ContentStar(info);
            // star.Properties can be edited later.
            star.Properties.Status = StarStatus.Bright; // This means the content is relevant and support for this star is wanted.
            star.Properties.Controllers = []; // I don't assign anyone else the ability to edit this data.

            // Push my data.
            star.Put(new ContentStar.DataSpan
            {
                // Inserting data from zero
                Offset = 0,
                Length = 0
            }, TarOfSeveralPhotos);


            // Give starId to friend.
            // On their constellation node:
            {
                var friendStar = new ContentStar(id);
                var handler = new ContentStar.ContentChangeHandler();

                // Can view the photos
                friendStar.Get(new ContentStar.DataSpan());

                // Can stay up-todate
                friendStar.SubscribeToContentChanges(handler);
            }


            // Some time later, I push an update.
            star.Put(new ContentStar.DataSpan
            {
                // Replacing the whole thing
                Offset = 0,
                Length = TarOfSeveralPhotos.Length
            }, TarOfEvenMorePhotos);


            // On my friend's node:
            {
                // change-handler is fired.
            }
        }
    }
}

