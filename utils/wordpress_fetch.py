import os
import dotenv
from sqlalchemy import create_engine
import html2text
import frontmatter
from collections import namedtuple
from io import BytesIO

dotenv.load_dotenv()


def connect_to_wp_db():
    engine = create_engine(os.environ['WP_DB_URL'])

    with engine.connect() as con:

        rs = con.execute(
            """
SELECT
    p.id,
    p.post_title,
    p.post_name,
    p.post_status, p.post_type, p.post_modified_gmt, p.post_content,
    GROUP_CONCAT(DISTINCT c.`name`) as categories,
    GROUP_CONCAT(DISTINCT t.`name`) as tags
FROM wp_posts p
LEFT JOIN wp_term_relationships cr
    on (p.`id`=cr.`object_id`)
LEFT JOIN wp_term_taxonomy ct
    on (ct.`term_taxonomy_id`=cr.`term_taxonomy_id`
    and ct.`taxonomy`='category')
LEFT JOIN wp_terms c on
    (ct.`term_id`=c.`term_id`)
LEFT JOIN wp_term_relationships tr
    on (p.`id`=tr.`object_id`)
LEFT JOIN wp_term_taxonomy tt
    on (tt.`term_taxonomy_id`=tr.`term_taxonomy_id`
    and tt.`taxonomy`='post_tag')
LEFT JOIN wp_terms t
    on (tt.`term_id`=t.`term_id`)
GROUP BY p.id

"""
        )

        for row in rs:
            # post_status, post_name, post_type, post_modified_gmt, post_content =
            pid, post_title, post_name, post_status, post_type, post_modified_gmt, post_content, categories, tags = row

            if post_title != '' and post_content != '' and post_status == 'publish' and post_type == 'post':
                md_content = store_as_md(post_content)
                thumb_rs = con.execute(
                    f"""
                                select meta_value FROM wp_postmeta
                                WHERE meta_key='_wp_attached_file' and post_id =  
                                (SELECT meta_value FROM wp_postmeta 
                                WHERE post_id={pid} AND 
                                meta_key='_thumbnail_id' )  
                                """
                )
                post_thumb = ''
                for thumb in thumb_rs:
                    post_thumb = thumb
                write_to_mdx(post_title, post_thumb[0], post_name, post_status,
                             post_type, post_modified_gmt, md_content, categories, tags)


def store_as_md(post_content):
    h = html2text.HTML2Text()
    h.ignore_links = False
    # h.mark_code = True
    return (h.handle(post_content))


def write_to_mdx(post_title, post_thumb, post_name, post_status, post_type, post_modified_gmt, md_content, categories, tags):
    metadata = {
        'title': post_title,
        'author': 'Sukhdeep Singh',
        'date': post_modified_gmt.strftime('%b, %y'),
        'description': '',
        'thumbnailUrl': f'https://pennow.tech/wp-content/uploads/{post_thumb}',
        'tags': tags.split(',') if tags else '',
        'categories': categories.split(','),
        'post_status': post_status,
        'post_type': post_type,
    }
    post = namedtuple('post', ['metadata', 'content'])
    post.metadata = metadata
    post.content = md_content

    with open(f'./utils/tmp/{post_name}.mdx', 'w', encoding='utf-8') as fd:
        import sys

        lines = frontmatter.dumps(post)
        print(lines, file=fd)


if __name__ == '__main__':
    connect_to_wp_db()


