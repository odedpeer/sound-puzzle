from pydub import AudioSegment
from pydub.playback import play
import scipy.io.wavfile
import matplotlib.pyplot as plt
import os

def plot(dir, filename, num):
    wav_filename = "./%s-%d.%s" % (filename, num, "wav")
    png_filename = "%s-%d.%s" % (filename, num, "png")
    with open(wav_filename, 'wb') as out_f:
        split.export(out_f, format="wav")
        rate, data = scipy.io.wavfile.read(wav_filename)
        plt.plot(data, color='blue')
        # remove axis
        plt.axis('off')
        # remove whitespace
        plt.gca().set_axis_off()
        plt.subplots_adjust(top = 1, bottom = 0, right = 1, left = 0,
                    hspace = 0, wspace = 0)
        plt.margins(0,0)
        plt.gca().xaxis.set_major_locator(plt.NullLocator())
        plt.gca().yaxis.set_major_locator(plt.NullLocator())
        # export fig
        plt.savefig("%s-%d.%s" % (filename, num, "png"), bbox_inches='tight', pad_inches = 0)
    os.remove(wav_filename)

dir = "/Users/opeer/Downloads"
filename = "elvis-falling-in-love"
extension = "mp3"
song = AudioSegment.from_mp3("%s/%s.%s" % (dir, filename, extension))

# split song
interval = 2 * 1000
cur = 0

song_length = len(song)
splits = []
while (cur < song_length):
    splits.append(song[cur : cur + interval])
    cur += interval

splits_to_save_start_index = 4
number_of_splits_to_save = 10
for num, split in enumerate(splits[splits_to_save_start_index : splits_to_save_start_index + number_of_splits_to_save], start=0):
    with open("./%s-%d.%s" % (filename, num, extension), 'wb') as out_f:
        split.export(out_f, format=extension)
    plot(dir, filename, num)
